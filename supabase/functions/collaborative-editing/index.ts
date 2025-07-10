import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EditingSession {
  documentId: string;
  userId: string;
  userName: string;
  cursorPosition: number;
  selection: { start: number; end: number } | null;
  lastActivity: number;
}

interface DocumentOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

// In-memory storage for active sessions (in production, use Redis or similar)
const activeSessions = new Map<string, Map<string, EditingSession>>();
const documentSockets = new Map<string, Set<WebSocket>>();

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const documentId = url.searchParams.get("documentId");
  const authHeader = headers.get("authorization");

  if (!documentId || !authHeader) {
    return new Response("Missing documentId or authorization", { status: 400 });
  }

  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Verify user authentication
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !userData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = userData.user;

  // Verify user has access to the document
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select(`
      *,
      projects!inner(
        id,
        company_id
      )
    `)
    .eq("id", documentId)
    .single();

  if (docError || !document) {
    return new Response("Document not found", { status: 404 });
  }

  // Check if user has write permission
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.company_id !== document.projects.company_id) {
    return new Response("Access denied", { status: 403 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = async () => {
    console.log(`User ${user.id} connected to document ${documentId}`);

    // Initialize document session if not exists
    if (!activeSessions.has(documentId)) {
      activeSessions.set(documentId, new Map());
    }
    if (!documentSockets.has(documentId)) {
      documentSockets.set(documentId, new Set());
    }

    // Add user to session
    const session: EditingSession = {
      documentId,
      userId: user.id,
      userName: profile.full_name || user.email || "Anonymous",
      cursorPosition: 0,
      selection: null,
      lastActivity: Date.now(),
    };

    activeSessions.get(documentId)!.set(user.id, session);
    documentSockets.get(documentId)!.add(socket);

    // Create or update file lock
    await supabase
      .from("file_locks")
      .upsert({
        document_id: parseInt(documentId),
        user_id: user.id,
        locked_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      }, { onConflict: 'document_id,user_id' });

    // Notify other users about new collaborator
    broadcastToDocument(documentId, {
      type: "user_joined",
      userId: user.id,
      userName: session.userName,
      activeUsers: Array.from(activeSessions.get(documentId)!.values()),
    }, socket);

    // Send current document content and active users to new user
    socket.send(JSON.stringify({
      type: "document_state",
      content: document.content || "",
      activeUsers: Array.from(activeSessions.get(documentId)!.values()),
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      const session = activeSessions.get(documentId)?.get(user.id);
      
      if (!session) return;

      session.lastActivity = Date.now();

      switch (message.type) {
        case "operation":
          await handleOperation(documentId, message.operation, user.id);
          break;
        
        case "cursor_update":
          session.cursorPosition = message.position;
          session.selection = message.selection;
          broadcastToDocument(documentId, {
            type: "cursor_update",
            userId: user.id,
            position: message.position,
            selection: message.selection,
          }, socket);
          break;

        case "save_document":
          await saveDocument(documentId, message.content, user.id);
          break;

        case "heartbeat":
          socket.send(JSON.stringify({ type: "heartbeat_ack" }));
          break;
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  };

  socket.onclose = async () => {
    console.log(`User ${user.id} disconnected from document ${documentId}`);
    
    // Remove user from session
    activeSessions.get(documentId)?.delete(user.id);
    documentSockets.get(documentId)?.delete(socket);

    // Remove file lock
    await supabase
      .from("file_locks")
      .delete()
      .eq("document_id", documentId)
      .eq("user_id", user.id);

    // Notify other users
    broadcastToDocument(documentId, {
      type: "user_left",
      userId: user.id,
      activeUsers: Array.from(activeSessions.get(documentId)?.values() || []),
    });

    // Clean up empty sessions
    if (activeSessions.get(documentId)?.size === 0) {
      activeSessions.delete(documentId);
      documentSockets.delete(documentId);
    }
  };

  return response;
});

function broadcastToDocument(documentId: string, message: any, exclude?: WebSocket) {
  const sockets = documentSockets.get(documentId);
  if (!sockets) return;

  const messageStr = JSON.stringify(message);
  for (const socket of sockets) {
    if (socket !== exclude && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(messageStr);
      } catch (error) {
        console.error("Error sending message to socket:", error);
      }
    }
  }
}

async function handleOperation(documentId: string, operation: DocumentOperation, userId: string) {
  // Apply operational transformation logic here
  // For now, broadcast the operation to all connected clients
  broadcastToDocument(documentId, {
    type: "operation",
    operation: {
      ...operation,
      userId,
      timestamp: Date.now(),
    },
  });
}

async function saveDocument(documentId: string, content: string, userId: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Update document content
    await supabase
      .from("documents")
      .update({ 
        content,
        file_size: content.length,
      })
      .eq("id", documentId);

    // Create version snapshot
    const { data: latestVersion } = await supabase
      .from("file_versions")
      .select("version_number")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestVersion?.version_number || 0) + 1;

    await supabase
      .from("file_versions")
      .insert({
        document_id: parseInt(documentId),
        version_number: nextVersion,
        content,
        content_hash: await hashContent(content),
        created_by: userId,
        change_description: "Auto-save",
        file_size: content.length,
      });

    // Notify all users about successful save
    broadcastToDocument(documentId, {
      type: "document_saved",
      version: nextVersion,
      savedBy: userId,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error("Error saving document:", error);
    broadcastToDocument(documentId, {
      type: "save_error",
      error: "Failed to save document",
    });
  }
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}