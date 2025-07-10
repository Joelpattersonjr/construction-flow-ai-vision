import { useState, useEffect, useRef, useCallback } from 'react';
import { CollaborativeEditingService, CollaborativeUser, DocumentOperation } from '@/services/collaborativeEditingService';
import { useToast } from '@/hooks/use-toast';

export const useCollaborativeEditor = (documentId: string) => {
  const [content, setContent] = useState('');
  const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedVersion, setLastSavedVersion] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const serviceRef = useRef<CollaborativeEditingService | null>(null);
  const lastContentRef = useRef('');
  const { toast } = useToast();

  // Initialize collaborative editing service
  useEffect(() => {
    if (!documentId) return;

    const service = new CollaborativeEditingService();
    serviceRef.current = service;

    // Set up event listeners
    service.onDocumentState((newContent, users) => {
      setContent(newContent);
      setActiveUsers(users);
      setIsConnected(true);
      setIsLoading(false);
      lastContentRef.current = newContent;
      setHasUnsavedChanges(false);
    });

    service.onOperation((operation) => {
      // Apply operation to content
      setContent(prevContent => {
        const newContent = applyOperation(prevContent, operation);
        return newContent;
      });
    });

    service.onUserJoined((user) => {
      setActiveUsers(prev => [...prev.filter(u => u.userId !== user.userId), user]);
      toast({
        title: "User joined",
        description: `${user.userName} started editing`,
      });
    });

    service.onUserLeft((userId) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== userId));
    });

    service.onCursorUpdate((userId, position, selection) => {
      setActiveUsers(prev => 
        prev.map(user => 
          user.userId === userId 
            ? { ...user, cursorPosition: position, selection }
            : user
        )
      );
    });

    service.onDocumentSaved((version, savedBy) => {
      setLastSavedVersion(version);
      setHasUnsavedChanges(false);
      toast({
        title: "Document saved",
        description: `Version ${version} saved successfully`,
      });
    });

    service.onError((error) => {
      toast({
        title: "Connection error",
        description: error,
        variant: "destructive",
      });
      setIsConnected(false);
    });

    // Connect to the document
    service.connect(documentId).catch((error) => {
      console.error('Failed to connect:', error);
      setIsLoading(false);
      toast({
        title: "Connection failed",
        description: "Failed to connect to collaborative editing session",
        variant: "destructive",
      });
    });

    return () => {
      service.disconnect();
    };
  }, [documentId, toast]);

  // Track content changes
  useEffect(() => {
    if (content !== lastContentRef.current) {
      setHasUnsavedChanges(true);
      lastContentRef.current = content;
    }
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !isConnected) return;

    const timer = setTimeout(() => {
      saveDocument();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [content, hasUnsavedChanges, isConnected]);

  const applyOperation = useCallback((text: string, operation: DocumentOperation): string => {
    const { type, position, content: opContent, length } = operation;
    
    switch (type) {
      case 'insert':
        return text.slice(0, position) + (opContent || '') + text.slice(position);
      
      case 'delete':
        return text.slice(0, position) + text.slice(position + (length || 0));
      
      case 'retain':
        return text; // No change for retain operations
      
      default:
        return text;
    }
  }, []);

  const handleTextChange = useCallback((newContent: string, cursorPosition: number) => {
    const oldContent = content;
    setContent(newContent);

    // Generate and send operation
    const operation = generateOperation(oldContent, newContent, cursorPosition);
    if (operation && serviceRef.current) {
      serviceRef.current.sendOperation(operation);
    }

    // Update cursor position
    if (serviceRef.current) {
      serviceRef.current.updateCursor(cursorPosition);
    }
  }, [content]);

  const generateOperation = useCallback((oldText: string, newText: string, cursorPos: number): Omit<DocumentOperation, 'userId' | 'timestamp'> | null => {
    // Simple diff algorithm - in production, use a more sophisticated approach
    const oldLength = oldText.length;
    const newLength = newText.length;
    
    if (newLength > oldLength) {
      // Insertion
      const insertPos = findInsertPosition(oldText, newText);
      const insertedContent = newText.slice(insertPos, insertPos + (newLength - oldLength));
      
      return {
        type: 'insert',
        position: insertPos,
        content: insertedContent,
      };
    } else if (newLength < oldLength) {
      // Deletion
      const deletePos = findDeletePosition(oldText, newText);
      
      return {
        type: 'delete',
        position: deletePos,
        length: oldLength - newLength,
      };
    }
    
    return null;
  }, []);

  const findInsertPosition = (oldText: string, newText: string): number => {
    for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
      if (oldText[i] !== newText[i]) {
        return i;
      }
    }
    return oldText.length;
  };

  const findDeletePosition = (oldText: string, newText: string): number => {
    for (let i = 0; i < Math.min(oldText.length, newText.length); i++) {
      if (oldText[i] !== newText[i]) {
        return i;
      }
    }
    return newText.length;
  };

  const saveDocument = useCallback(() => {
    if (serviceRef.current && content !== lastContentRef.current) {
      serviceRef.current.saveDocument(content);
    }
  }, [content]);

  const createManualVersion = useCallback(async (description: string) => {
    try {
      await CollaborativeEditingService.createManualVersion(documentId, content, description);
      toast({
        title: "Version created",
        description: `Manual version "${description}" created successfully`,
      });
    } catch (error) {
      console.error('Error creating manual version:', error);
      toast({
        title: "Error",
        description: "Failed to create manual version",
        variant: "destructive",
      });
    }
  }, [documentId, content, toast]);

  return {
    content,
    setContent: handleTextChange,
    activeUsers,
    isConnected,
    isLoading,
    hasUnsavedChanges,
    lastSavedVersion,
    saveDocument,
    createManualVersion,
  };
};