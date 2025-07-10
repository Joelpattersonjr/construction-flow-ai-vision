import { supabase } from '@/integrations/supabase/client';

export interface CollaborativeUser {
  userId: string;
  userName: string;
  cursorPosition: number;
  selection: { start: number; end: number } | null;
  color: string;
}

export interface DocumentOperation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

export interface DocumentVersion {
  id: string;
  version_number: number;
  content: string;
  content_hash: string;
  created_by: string;
  created_at: string;
  change_description: string;
  file_size: number;
}

export class CollaborativeEditingService {
  private socket: WebSocket | null = null;
  private documentId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: number | null = null;
  
  private onDocumentStateCallback?: (content: string, activeUsers: CollaborativeUser[]) => void;
  private onOperationCallback?: (operation: DocumentOperation) => void;
  private onUserJoinedCallback?: (user: CollaborativeUser) => void;
  private onUserLeftCallback?: (userId: string) => void;
  private onCursorUpdateCallback?: (userId: string, position: number, selection: any) => void;
  private onDocumentSavedCallback?: (version: number, savedBy: string) => void;
  private onErrorCallback?: (error: string) => void;

  private userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  async connect(documentId: string) {
    this.documentId = documentId;
    await this.establishConnection();
  }

  private async establishConnection() {
    if (!this.documentId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        this.onErrorCallback?.('Not authenticated');
        return;
      }

      // Get the WebSocket URL for the collaborative editing function
      const supabaseUrl = 'https://gnyflfsqaqnxgnpsshwe.supabase.co'; // Using project URL directly
      const wsUrl = new URL(`${supabaseUrl.replace('https://', 'wss://').replace('http://', 'ws://')}/functions/v1/collaborative-editing`);
      wsUrl.searchParams.set('documentId', this.documentId);

      this.socket = new WebSocket(wsUrl.toString());
      
      // Send auth token in first message instead of headers (WebSocket limitation)
      this.socket.onopen = () => {
        console.log('Connected to collaborative editing session');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        
        // Send authentication
        this.socket?.send(JSON.stringify({
          type: 'authenticate',
          token: session.access_token,
        }));
      };


      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('Disconnected from collaborative editing session');
        this.stopHeartbeat();
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.establishConnection();
          }, Math.pow(2, this.reconnectAttempts) * 1000);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onErrorCallback?.('Connection error');
      };

    } catch (error) {
      console.error('Error establishing connection:', error);
      this.onErrorCallback?.('Failed to connect');
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'document_state':
        const users = message.activeUsers.map((user: any, index: number) => ({
          ...user,
          color: this.userColors[index % this.userColors.length],
        }));
        this.onDocumentStateCallback?.(message.content, users);
        break;

      case 'operation':
        this.onOperationCallback?.(message.operation);
        break;

      case 'user_joined':
        const newUser = {
          ...message,
          color: this.userColors[message.activeUsers.length % this.userColors.length],
        };
        this.onUserJoinedCallback?.(newUser);
        break;

      case 'user_left':
        this.onUserLeftCallback?.(message.userId);
        break;

      case 'cursor_update':
        this.onCursorUpdateCallback?.(message.userId, message.position, message.selection);
        break;

      case 'document_saved':
        this.onDocumentSavedCallback?.(message.version, message.savedBy);
        break;

      case 'save_error':
        this.onErrorCallback?.(message.error);
        break;

      case 'heartbeat_ack':
        // Heartbeat acknowledged
        break;
    }
  }

  sendOperation(operation: Omit<DocumentOperation, 'userId' | 'timestamp'>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'operation',
        operation,
      }));
    }
  }

  updateCursor(position: number, selection: { start: number; end: number } | null = null) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'cursor_update',
        position,
        selection,
      }));
    }
  }

  saveDocument(content: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'save_document',
        content,
      }));
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // Event listeners
  onDocumentState(callback: (content: string, activeUsers: CollaborativeUser[]) => void) {
    this.onDocumentStateCallback = callback;
  }

  onOperation(callback: (operation: DocumentOperation) => void) {
    this.onOperationCallback = callback;
  }

  onUserJoined(callback: (user: CollaborativeUser) => void) {
    this.onUserJoinedCallback = callback;
  }

  onUserLeft(callback: (userId: string) => void) {
    this.onUserLeftCallback = callback;
  }

  onCursorUpdate(callback: (userId: string, position: number, selection: any) => void) {
    this.onCursorUpdateCallback = callback;
  }

  onDocumentSaved(callback: (version: number, savedBy: string) => void) {
    this.onDocumentSavedCallback = callback;
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  // Static methods for file versions
  static async getFileVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data, error } = await supabase
      .from('file_versions')
      .select(`
        *,
        profiles!file_versions_created_by_fkey(full_name)
      `)
      .eq('document_id', parseInt(documentId))
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getFileVersion(documentId: string, versionNumber: number): Promise<DocumentVersion | null> {
    const { data, error } = await supabase
      .from('file_versions')
      .select('*')
      .eq('document_id', parseInt(documentId))
      .eq('version_number', versionNumber)
      .single();

    if (error) throw error;
    return data;
  }

  static async revertToVersion(documentId: string, versionNumber: number): Promise<void> {
    const version = await this.getFileVersion(documentId, versionNumber);
    if (!version) throw new Error('Version not found');

    const { error } = await supabase
      .from('documents')
      .update({ 
        content: version.content,
        file_size: version.file_size,
      })
      .eq('id', parseInt(documentId));

    if (error) throw error;

    // Create a new version entry for the revert
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    await this.createManualVersion(documentId, version.content, `Reverted to version ${versionNumber}`);
  }

  static async createManualVersion(documentId: string, content: string, description: string): Promise<void> {
    const { data: latestVersion } = await supabase
      .from('file_versions')
      .select('version_number')
      .eq('document_id', parseInt(documentId))
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestVersion?.version_number || 0) + 1;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate content hash
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { error } = await supabase
      .from('file_versions')
      .insert({
        document_id: parseInt(documentId),
        version_number: nextVersion,
        content,
        content_hash: contentHash,
        created_by: user.id,
        change_description: description,
        file_size: content.length,
      });

    if (error) throw error;
  }
}