import { Server, Socket } from 'socket.io';
import { collaborationManager, UserPresence } from '../crdt/collaboration-manager.js';
import { encodeStateAsUpdate, applyUpdate } from 'yjs';
import { v4 as uuidv4 } from 'uuid';

interface RoomState {
  socket: Socket;
  userId: string;
  documentId: string;
  cursor?: { lineNumber: number; column: number };
  selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
}

const rooms: Map<string, Map<string, RoomState>> = new Map();
const socketToRoom: Map<string, { documentId: string; userId: string }> = new Map();

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-document', async (data: {
      documentId: string;
      userId: string;
      userName: string;
      userColor?: string;
      token?: string;
    }) => {
      try {
        const { documentId, userId, userName, userColor } = data;

        socket.join(documentId);

        if (!rooms.has(documentId)) {
          rooms.set(documentId, new Map());
        }

        const room = rooms.get(documentId)!;
        room.set(socket.id, {
          socket,
          userId,
          documentId,
        });

        socketToRoom.set(socket.id, { documentId, userId });

        const state = collaborationManager.getOrCreateDocument(documentId);

        const presence: UserPresence = {
          id: userId,
          name: userName,
          color: userColor || collaborationManager.generateUserColor(),
          lastActivity: Date.now(),
        };

        collaborationManager.addUser(documentId, parseInt(socket.id, 36), presence);

        const documentState = encodeStateAsUpdate(state.doc);
        const base64State = Buffer.from(documentState).toString('base64');

        socket.emit('document-sync', {
          state: base64State,
          documentId,
        });

        const users = collaborationManager.getUserPresences(documentId);
        io.to(documentId).emit('presence-update', { users });

        socket.emit('sync-ready', { documentId });

        console.log(`User ${userName} joined document ${documentId}`);
      } catch (error) {
        console.error('Error joining document:', error);
        socket.emit('error', { message: 'Failed to join document' });
      }
    });

    socket.on('update', (data: {
      documentId: string;
      update: string;
      clock: number;
    }) => {
      try {
        const { documentId, update, clock } = data;
        const state = rooms.get(documentId);
        if (!state) return;

        const roomState = state.get(socket.id);
        if (!roomState) return;

        const binaryUpdate = Buffer.from(update, 'base64');
        const newUpdate = collaborationManager.applyUpdate(documentId, binaryUpdate, parseInt(socket.id, 36));

        socket.to(documentId).emit('remote-update', {
          update,
          clientId: socket.id,
          clock,
        });

        collaborationManager.broadcastToDocument(documentId, 'update', { update, clock }, parseInt(socket.id, 36));
      } catch (error) {
        console.error('Error applying update:', error);
      }
    });

    socket.on('cursor-move', (data: {
      documentId: string;
      cursor: { lineNumber: number; column: number };
    }) => {
      const { documentId, cursor } = data;
      const room = rooms.get(documentId);
      if (!room) return;

      const roomState = room.get(socket.id);
      if (!roomState) return;

      roomState.cursor = cursor;

      socket.to(documentId).emit('remote-cursor', {
        userId: roomState.userId,
        cursor,
        clientId: socket.id,
      });
    });

    socket.on('selection-change', (data: {
      documentId: string;
      selection: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
    }) => {
      const { documentId, selection } = data;
      const room = rooms.get(documentId);
      if (!room) return;

      const roomState = room.get(socket.id);
      if (!roomState) return;

      roomState.selection = selection;

      socket.to(documentId).emit('remote-selection', {
        userId: roomState.userId,
        selection,
        clientId: socket.id,
      });
    });

    socket.on('awareness-update', (data: {
      documentId: string;
      state: any;
    }) => {
      socket.to(data.documentId).emit('awareness-update', {
        clientId: socket.id,
        state: data.state,
      });
    });

    socket.on('request-sync', (data: { documentId: string; clientId: string }) => {
      const { documentId, clientId } = data;
      const state = collaborationManager.getDocument(documentId);

      if (state) {
        const documentState = encodeStateAsUpdate(state.doc);
        const base64State = Buffer.from(documentState).toString('base64');

        io.to(clientId).emit('sync-update', {
          state: base64State,
          documentId,
        });
      }
    });

    socket.on('get-presence', (data: { documentId: string }) => {
      const users = collaborationManager.getUserPresences(data.documentId);
      socket.emit('presence-update', { users });
    });

    socket.on('create-file', (data: {
      documentId: string;
      fileId: string;
      path: string;
      language: string;
    }) => {
      socket.to(data.documentId).emit('file-created', {
        fileId: data.fileId,
        path: data.path,
        language: data.language,
        createdBy: socket.id,
      });
    });

    socket.on('delete-file', (data: {
      documentId: string;
      fileId: string;
      path: string;
    }) => {
      socket.to(data.documentId).emit('file-deleted', {
        fileId: data.fileId,
        path: data.path,
        deletedBy: socket.id,
      });
    });

    socket.on('rename-file', (data: {
      documentId: string;
      fileId: string;
      oldPath: string;
      newPath: string;
    }) => {
      socket.to(data.documentId).emit('file-renamed', {
        fileId: data.fileId,
        oldPath: data.oldPath,
        newPath: data.newPath,
        renamedBy: socket.id,
      });
    });

    socket.on('add-comment', (data: {
      documentId: string;
      comment: {
        id: string;
        fileId: string;
        content: string;
        lineStart: number;
        lineEnd: number;
      };
    }) => {
      socket.to(data.documentId).emit('comment-added', {
        comment: data.comment,
        userId: socketToRoom.get(socket.id)?.userId,
      });
    });

    socket.on('resolve-comment', (data: {
      documentId: string;
      commentId: string;
      resolved: boolean;
    }) => {
      socket.to(data.documentId).emit('comment-resolved', {
        commentId: data.commentId,
        resolved: data.resolved,
        userId: socketToRoom.get(socket.id)?.userId,
      });
    });

    socket.on('start-call', (data: { documentId: string; callId: string }) => {
      socket.to(data.documentId).emit('call-started', {
        callId: data.callId,
        initiatedBy: socket.id,
      });
    });

    socket.on('join-call', (data: { callId: string; documentId: string }) => {
      socket.to(data.documentId).emit('user-joined-call', {
        userId: socketToRoom.get(socket.id)?.userId,
        callId: data.callId,
      });
    });

    socket.on('leave-call', (data: { callId: string; documentId: string }) => {
      socket.to(data.documentId).emit('user-left-call', {
        userId: socketToRoom.get(socket.id)?.userId,
        callId: data.callId,
      });
    });

    socket.on('webrtc-signal', (data: {
      targetId: string;
      signal: any;
      callId: string;
    }) => {
      io.to(data.targetId).emit('webrtc-signal', {
        from: socket.id,
        signal: data.signal,
        callId: data.callId,
      });
    });

    socket.on('execution-request', (data: {
      documentId: string;
      code: string;
      language: string;
      executionId: string;
    }) => {
      socket.to(data.documentId).emit('execution-started', {
        executionId: data.executionId,
        language: data.language,
        userId: socketToRoom.get(socket.id)?.userId,
      });
    });

    socket.on('execution-result', (data: {
      documentId: string;
      executionId: string;
      result: any;
      status: 'success' | 'error';
    }) => {
      socket.to(data.documentId).emit('execution-completed', {
        executionId: data.executionId,
        result: data.result,
        status: data.status,
        userId: socketToRoom.get(socket.id)?.userId,
      });
    });

    socket.on('git-status', (data: {
      documentId: string;
      status: {
        branch: string;
        ahead: number;
        behind: number;
        modified: string[];
        staged: string[];
        untracked: string[];
      };
    }) => {
      socket.to(data.documentId).emit('git-status-update', {
        status: data.status,
        userId: socketToRoom.get(socket.id)?.userId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      const roomInfo = socketToRoom.get(socket.id);
      if (roomInfo) {
        const { documentId, userId } = roomInfo;

        const room = rooms.get(documentId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            rooms.delete(documentId);
          }
        }

        collaborationManager.removeUser(documentId, parseInt(socket.id, 36));

        const users = collaborationManager.getUserPresences(documentId);
        io.to(documentId).emit('presence-update', { users });

        socketToRoom.delete(socket.id);
      }
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  setInterval(() => {
    rooms.forEach((room, documentId) => {
      const stats = collaborationManager.getDocumentStats(documentId);
      io.to(documentId).emit('document-stats', stats);
    });
  }, 30000);
}
