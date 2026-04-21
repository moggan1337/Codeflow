import * as Y from 'yjs';
import { encodeStateAsUpdate, applyUpdate, Doc } from 'yjs';
import { v4 as uuidv4 } from 'uuid';
import { Awareness } from 'y-protocols/awareness';

export interface CollaborationState {
  doc: Doc;
  awareness: Awareness;
  users: Map<number, UserPresence>;
  pendingUpdates: Uint8Array[];
  vectorClock: Map<string, number>;
}

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  avatar?: string;
  lastActivity: number;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
  fileId: string;
}

export interface SelectionRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  fileId: string;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF8C00',
];

export class CollaborationManager {
  private documents: Map<string, CollaborationState> = new Map();
  private static instance: CollaborationManager;

  private constructor() {}

  static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager();
    }
    return CollaborationManager.instance;
  }

  createDocument(documentId: string): CollaborationState {
    if (this.documents.has(documentId)) {
      return this.documents.get(documentId)!;
    }

    const doc = new Doc();
    const awareness = new Awareness(doc);

    const state: CollaborationState = {
      doc,
      awareness,
      users: new Map(),
      pendingUpdates: [],
      vectorClock: new Map(),
    };

    awareness.on('change', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const changedClients = [...added, ...updated, ...removed];
      const userStates = new Map<number, UserPresence>();
      
      awareness.getStates().forEach((state, clientId) => {
        if (state && typeof state === 'object') {
          userStates.set(clientId, state as UserPresence);
        }
      });

      state.users = userStates;
    });

    doc.gc = true;

    this.documents.set(documentId, state);
    return state;
  }

  getDocument(documentId: string): CollaborationState | undefined {
    return this.documents.get(documentId);
  }

  getOrCreateDocument(documentId: string): CollaborationState {
    return this.getDocument(documentId) || this.createDocument(documentId);
  }

  addUser(documentId: string, clientId: number, user: UserPresence): void {
    const state = this.getOrCreateDocument(documentId);
    state.awareness.setLocalStateField('user', user);
  }

  removeUser(documentId: string, clientId: number): void {
    const state = this.getDocument(documentId);
    if (state) {
      state.awareness.setLocalState(null, clientId);
    }
  }

  updateCursor(documentId: string, clientId: number, cursor: CursorPosition): void {
    const state = this.getDocument(documentId);
    if (state) {
      const currentState = state.awareness.getLocalState() as UserPresence | null;
      if (currentState) {
        state.awareness.setLocalStateField('cursor', cursor);
      }
    }
  }

  updateSelection(documentId: string, clientId: number, selection: SelectionRange): void {
    const state = this.getDocument(documentId);
    if (state) {
      state.awareness.setLocalStateField('selection', selection);
    }
  }

  applyUpdate(documentId: string, update: Uint8Array, clientId: number): Uint8Array {
    const state = this.getOrCreateDocument(documentId);
    
    const currentClock = state.vectorClock.get(String(clientId)) || 0;
    state.vectorClock.set(String(clientId), currentClock + 1);

    applyUpdate(state.doc, update, 'server');

    return encodeStateAsUpdate(state.doc);
  }

  getState(documentId: string): Uint8Array | null {
    const state = this.getDocument(documentId);
    if (!state) return null;
    return encodeStateAsUpdate(state.doc);
  }

  getUserPresences(documentId: string): UserPresence[] {
    const state = this.getDocument(documentId);
    if (!state) return [];

    const presences: UserPresence[] = [];
    state.awareness.getStates().forEach((state) => {
      if (state && typeof state === 'object' && 'id' in state) {
        presences.push(state as UserPresence);
      }
    });

    return presences;
  }

  generateUserColor(): string {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  broadcastToDocument(documentId: string, event: string, data: any, excludeClient?: number): void {
    const state = this.getDocument(documentId);
    if (!state) return;

    const clients = state.awareness.getStates().keys();
    for (const clientId of clients) {
      if (clientId !== excludeClient) {
      }
    }
  }

  deleteDocument(documentId: string): void {
    const state = this.getDocument(documentId);
    if (state) {
      state.doc.destroy();
      state.awareness.destroy();
      this.documents.delete(documentId);
    }
  }

  getDocumentStats(documentId: string): {
    userCount: number;
    pendingUpdates: number;
    documentSize: number;
  } {
    const state = this.getDocument(documentId);
    if (!state) {
      return { userCount: 0, pendingUpdates: 0, documentSize: 0 };
    }

    const stateVector = encodeStateAsUpdate(state.doc);

    return {
      userCount: state.awareness.getStates().size,
      pendingUpdates: state.pendingUpdates.length,
      documentSize: stateVector.length,
    };
  }
}

export const collaborationManager = CollaborationManager.getInstance();
