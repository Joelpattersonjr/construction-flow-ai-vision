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

  // Static methods for file versions (placeholder implementations until database migration is applied)
  static async getFileVersions(documentId: string): Promise<DocumentVersion[]> {
    console.log('Version history not yet available - database migration required');
    return [];
  }

  static async getFileVersion(documentId: string, versionNumber: number): Promise<DocumentVersion | null> {
    console.log('Version retrieval not yet available - database migration required');
    return null;
  }

  static async revertToVersion(documentId: string, versionNumber: number): Promise<void> {
    throw new Error('Version revert functionality not yet available - database migration required');
  }

  static async createManualVersion(documentId: string, content: string, description: string): Promise<void> {
    throw new Error('Manual version creation not yet available - database migration required');
  }
}