import { create } from 'zustand';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor?: { lineNumber: number; column: number };
  selection?: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
}

interface File {
  id: string;
  path: string;
  content?: string;
  language?: string;
  isDirectory: boolean;
}

interface EditorState {
  documentId: string | null;
  projectId: string | null;
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  awareness: any;
  files: File[];
  currentFile: File | null;
  openFiles: File[];
  presences: UserPresence[];
  isConnected: boolean;
  isSynced: boolean;
  comments: any[];
  gitStatus: any;
  callStatus: { active: boolean; participants: string[] };
  terminalOutput: string[];
  executionResult: any;

  initializeDocument: (documentId: string, serverUrl: string) => void;
  disconnect: () => void;
  setCurrentFile: (file: File) => void;
  openFile: (file: File) => void;
  closeFile: (fileId: string) => void;
  setFiles: (files: File[]) => void;
  updatePresence: (data: Partial<UserPresence>) => void;
  addComment: (comment: any) => void;
  updateComment: (commentId: string, data: any) => void;
  removeComment: (commentId: string) => void;
  setGitStatus: (status: any) => void;
  setCallStatus: (status: { active: boolean; participants: string[] }) => void;
  addTerminalOutput: (output: string) => void;
  clearTerminal: () => void;
  setExecutionResult: (result: any) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  documentId: null,
  projectId: null,
  ydoc: null,
  provider: null,
  awareness: null,
  files: [],
  currentFile: null,
  openFiles: [],
  presences: [],
  isConnected: false,
  isSynced: false,
  comments: [],
  gitStatus: null,
  callStatus: { active: false, participants: [] },
  terminalOutput: [],
  executionResult: null,

  initializeDocument: (documentId: string, serverUrl: string) => {
    const ydoc = new Y.Doc();

    const wsUrl = serverUrl.replace('http', 'ws');
    const provider = new WebsocketProvider(wsUrl, documentId, ydoc, {
      connect: true,
      params: {},
      WebSocketPolyfill: WebSocket,
      resyncInterval: 10000,
      maxBackoffTime: 2500,
      disableBc: false,
    });

    provider.on('status', (event: { status: string }) => {
      set({ isConnected: event.status === 'connected' });
    });

    provider.on('sync', (isSynced: boolean) => {
      set({ isSynced });
    });

    const awareness = provider.awareness;

    awareness.on('change', () => {
      const states = awareness.getStates();
      const presences: UserPresence[] = [];

      states.forEach((state: any, clientId: number) => {
        if (state && state.user) {
          presences.push({
            ...state.user,
            clientId,
          });
        }
      });

      set({ presences });
    });

    set({
      documentId,
      ydoc,
      provider,
      awareness,
    });
  },

  disconnect: () => {
    const { provider, ydoc } = get();

    if (provider) {
      provider.disconnect();
      provider.destroy();
    }

    if (ydoc) {
      ydoc.destroy();
    }

    set({
      documentId: null,
      ydoc: null,
      provider: null,
      awareness: null,
      isConnected: false,
      isSynced: false,
      presences: [],
    });
  },

  setCurrentFile: (file: File) => {
    set({ currentFile: file });
  },

  openFile: (file: File) => {
    const { openFiles } = get();
    if (!openFiles.find(f => f.id === file.id)) {
      set({ openFiles: [...openFiles, file] });
    }
    set({ currentFile: file });
  },

  closeFile: (fileId: string) => {
    const { openFiles, currentFile } = get();
    const newOpenFiles = openFiles.filter(f => f.id !== fileId);

    if (currentFile?.id === fileId) {
      set({
        openFiles: newOpenFiles,
        currentFile: newOpenFiles[0] || null,
      });
    } else {
      set({ openFiles: newOpenFiles });
    }
  },

  setFiles: (files: File[]) => {
    set({ files });
  },

  updatePresence: (data: Partial<UserPresence>) => {
    const { awareness } = get();
    if (awareness) {
      const currentState = awareness.getLocalState() || {};
      awareness.setLocalState({
        ...currentState,
        ...data,
      });
    }
  },

  addComment: (comment: any) => {
    set(state => ({ comments: [...state.comments, comment] }));
  },

  updateComment: (commentId: string, data: any) => {
    set(state => ({
      comments: state.comments.map(c =>
        c.id === commentId ? { ...c, ...data } : c
      ),
    }));
  },

  removeComment: (commentId: string) => {
    set(state => ({
      comments: state.comments.filter(c => c.id !== commentId),
    }));
  },

  setGitStatus: (status: any) => {
    set({ gitStatus: status });
  },

  setCallStatus: (status: { active: boolean; participants: string[] }) => {
    set({ callStatus: status });
  },

  addTerminalOutput: (output: string) => {
    set(state => ({
      terminalOutput: [...state.terminalOutput, output],
    }));
  },

  clearTerminal: () => {
    set({ terminalOutput: [] });
  },

  setExecutionResult: (result: any) => {
    set({ executionResult: result });
  },
}));
