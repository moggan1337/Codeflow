import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuthStore } from '../../store/auth';
import { useEditorStore } from '../../store/editor';
import { FileExplorer } from './FileExplorer';
import { Terminal } from './Terminal';
import { CommentsPanel } from '../review/CommentsPanel';
import { CallControls } from '../calls/CallControls';
import { PresenceBar } from '../collaboration/PresenceBar';
import { Toolbar } from './Toolbar';
import { getLanguageFromExtension, SUPPORTED_LANGUAGES } from '../../types';
import type { editor } from 'monaco-editor';

export const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'files' | 'git' | 'search'>('files');
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [executionLanguage, setExecutionLanguage] = useState('javascript');
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const cursorDecorationsRef = useRef<Map<string, string>>(new Map());

  const {
    files,
    currentFile,
    openFiles,
    presences,
    isConnected,
    setFiles,
    setCurrentFile,
    openFile,
    closeFile,
    initializeDocument,
    disconnect,
    addTerminalOutput,
    clearTerminal,
    setExecutionResult,
  } = useEditorStore();

  useEffect(() => {
    loadProject();
    return () => {
      disconnect();
    };
  }, [projectId]);

  useEffect(() => {
    if (currentFile) {
      const ext = currentFile.path.split('.').pop() || '';
      const lang = getLanguageFromExtension(currentFile.path);
      setExecutionLanguage(lang);
    }
  }, [currentFile]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }

      initializeCollaboration();
      loadGitStatus();
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeCollaboration = () => {
    if (!projectId) return;

    const wsUrl = window.location.protocol === 'https:' 
      ? 'wss://' + window.location.host 
      : 'ws://localhost:4000';

    initializeDocument(projectId, wsUrl);
  };

  const loadGitStatus = async () => {
    try {
      const response = await fetch(`/api/git/${projectId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGitStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to load git status:', error);
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      const { lineNumber, column } = e.position;
      
      useEditorStore.getState().updatePresence({
        cursor: { lineNumber, column, fileId: currentFile?.id || '' },
      });
    });

    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      
      useEditorStore.getState().updatePresence({
        selection: {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
          fileId: currentFile?.id || '',
        },
      });
    });
  };

  const handleEditorChange: OnChange = (value) => {
  };

  const executeCode = async () => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    addTerminalOutput(`> Running ${executionLanguage} code...`);
    setShowTerminal(true);

    try {
      const response = await fetch('/api/execute/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          language: executionLanguage,
          projectId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExecutionResult(data.result);

        if (data.result.stdout) {
          addTerminalOutput(data.result.stdout);
        }
        if (data.result.stderr) {
          addTerminalOutput(`Error: ${data.result.stderr}`);
        }
        if (data.result.error) {
          addTerminalOutput(`Runtime Error: ${data.result.error}`);
        }
        addTerminalOutput(`\nExecution completed in ${data.executionTime}ms`);
      }
    } catch (error) {
      addTerminalOutput(`Error: ${error}`);
    }
  };

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;
      setTerminalHeight(Math.max(100, Math.min(newHeight, 500)));
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations = presences
      .filter(p => p.cursor && p.id !== user?.id)
      .map(p => {
        if (!p.cursor) return null;
        
        return {
          range: new monacoRef.current.Range(
            p.cursor.lineNumber,
            p.cursor.column,
            p.cursor.lineNumber,
            p.cursor.column + 1
          ),
          options: {
            className: `presence-cursor-${p.id}`,
            beforeContentClassName: `presence-cursor-${p.id}`,
            hoverMessage: { value: p.name },
          },
        };
      })
      .filter(Boolean);

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      decorations as any
    );
  }, [presences, user?.id]);

  useEffect(() => {
    if (!editorRef.current || !currentFile) return;

    const loadFileContent = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/files/${currentFile.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          editorRef.current?.setValue(data.file.content || '');
        }
      } catch (error) {
        console.error('Failed to load file:', error);
      }
    };

    loadFileContent();
  }, [currentFile?.id]);

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <h2>Loading Project</h2>
        <p>Setting up your collaborative workspace...</p>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <Toolbar
        projectId={projectId!}
        onExecute={executeCode}
        executionLanguage={executionLanguage}
        onLanguageChange={setExecutionLanguage}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        onToggleComments={() => setShowComments(!showComments)}
        gitStatus={gitStatus}
      />

      <div className="editor-main">
        <div className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeSidebarTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('files')}
            >
              Files
            </button>
            <button
              className={`sidebar-tab ${activeSidebarTab === 'git' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('git')}
            >
              Git
            </button>
          </div>

          <div className="sidebar-content">
            {activeSidebarTab === 'files' && (
              <FileExplorer
                files={files}
                currentFile={currentFile}
                onFileSelect={(file) => {
                  openFile(file);
                  setCurrentFile(file);
                }}
                projectId={projectId!}
              />
            )}

            {activeSidebarTab === 'git' && (
              <GitPanel
                projectId={projectId!}
                gitStatus={gitStatus}
                onRefresh={loadGitStatus}
              />
            )}
          </div>
        </div>

        <div className="editor-wrapper">
          {openFiles.length > 0 && (
            <div className="tabs-bar">
              {openFiles.map((file) => (
                <div
                  key={file.id}
                  className={`editor-tab ${currentFile?.id === file.id ? 'active' : ''}`}
                  onClick={() => setCurrentFile(file)}
                >
                  <span>{file.path.split('/').pop()}</span>
                  <button
                    className="close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeFile(file.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="monaco-editor-container">
            {currentFile ? (
              <Editor
                height="100%"
                language={getLanguageFromExtension(currentFile.path)}
                value={currentFile.content || ''}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  bracketPairColorization: { enabled: true },
                  padding: { top: 10 },
                }}
              />
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <h3>No file selected</h3>
                <p>Select a file from the sidebar to start editing</p>
              </div>
            )}
          </div>

          {showTerminal && (
            <div style={{ height: terminalHeight, display: 'flex', flexDirection: 'column' }}>
              <div className="panel-resize-handle" onMouseDown={handleMouseDown} />
              <Terminal
                onClose={() => setShowTerminal(false)}
                onClear={clearTerminal}
              />
            </div>
          )}
        </div>

        {showComments && (
          <CommentsPanel
            projectId={projectId!}
            fileId={currentFile?.id}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>

      <PresenceBar presences={presences} isConnected={isConnected} />
      <CallControls />
    </div>
  );
};

interface GitPanelProps {
  projectId: string;
  gitStatus: any;
  onRefresh: () => void;
}

const GitPanel: React.FC<GitPanelProps> = ({ projectId, gitStatus, onRefresh }) => {
  const { token } = useAuthStore();
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewBranch, setShowNewBranch] = useState(false);

  useEffect(() => {
    loadBranches();
  }, [projectId]);

  const loadBranches = async () => {
    try {
      const response = await fetch(`/api/git/${projectId}/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || ['main']);
        setCurrentBranch(data.currentBranch || 'main');
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const createBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    try {
      const response = await fetch(`/api/git/${projectId}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newBranchName }),
      });

      if (response.ok) {
        loadBranches();
        setNewBranchName('');
        setShowNewBranch(false);
      }
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  const checkout = async (branch: string) => {
    try {
      const response = await fetch(`/api/git/${projectId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ branch }),
      });

      if (response.ok) {
        setCurrentBranch(branch);
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to checkout:', error);
    }
  };

  return (
    <div className="git-panel">
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Current: {currentBranch}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onRefresh}>
            ↻
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Status</div>
        {gitStatus?.clean ? (
          <span style={{ color: 'var(--color-success)' }}>✓ Clean</span>
        ) : (
          <>
            {gitStatus?.modified?.length > 0 && (
              <div style={{ color: 'var(--color-warning)' }}>
                {gitStatus.modified.length} modified
              </div>
            )}
            {gitStatus?.untracked?.length > 0 && (
              <div style={{ color: 'var(--color-text-muted)' }}>
                {gitStatus.untracked.length} untracked
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 500 }}>Branches</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowNewBranch(!showNewBranch)}
          >
            +
          </button>
        </div>

        {showNewBranch && (
          <form onSubmit={createBranch} style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="branch-name"
              style={{ fontSize: '0.85rem' }}
            />
          </form>
        )}

        {branches.map((branch) => (
          <div
            key={branch}
            onClick={() => checkout(branch)}
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: branch === currentBranch ? 'var(--color-bg-tertiary)' : 'transparent',
              color: branch === currentBranch ? 'var(--color-primary)' : 'var(--color-text-primary)',
            }}
          >
            {branch === currentBranch ? '● ' : '  '}{branch}
          </div>
        ))}
      </div>
    </div>
  );
};
