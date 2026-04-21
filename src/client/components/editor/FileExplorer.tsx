import React, { useState } from 'react';
import { useAuthStore } from '../../store/auth';
import { getLanguageFromExtension } from '../../types';

interface File {
  id: string;
  path: string;
  content?: string;
  language?: string;
  isDirectory: boolean;
}

interface FileExplorerProps {
  files: File[];
  currentFile: File | null;
  onFileSelect: (file: File) => void;
  projectId: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  currentFile,
  onFileSelect,
  projectId,
}) => {
  const { token } = useAuthStore();
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const createFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const path = `/${newItemName}`;
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path,
          language: getLanguageFromExtension(newItemName),
          isDirectory: false,
        }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create file:', error);
    }

    setNewItemName('');
    setShowNewFile(false);
  };

  const createFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const path = `/${newItemName}`;
      const response = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path,
          isDirectory: true,
        }),
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }

    setNewItemName('');
    setShowNewFolder(false);
  };

  const getFileIcon = (path: string, isDirectory: boolean) => {
    if (isDirectory) {
      return '📁';
    }

    const ext = path.split('.').pop()?.toLowerCase() || '';
    const icons: Record<string, string> = {
      js: '🟨',
      jsx: '⚛️',
      ts: '🔷',
      tsx: '⚛️',
      py: '🐍',
      java: '☕',
      go: '🔵',
      rs: '🦀',
      rb: '💎',
      php: '🐘',
      html: '🌐',
      css: '🎨',
      scss: '🎨',
      json: '📋',
      md: '📝',
      sql: '🗃️',
      sh: '🖥️',
      yaml: '⚙️',
      yml: '⚙️',
    };

    return icons[ext] || '📄';
  };

  const buildTree = (files: File[]) => {
    const root: Record<string, any> = { '/': { children: {} } };

    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean);
      let current = root['/'].children;

      parts.forEach((part, index) => {
        if (!current[part]) {
          const isLast = index === parts.length - 1;
          current[part] = {
            name: part,
            fullPath: '/' + parts.slice(0, index + 1).join('/'),
            isDirectory: isLast ? file.isDirectory : false,
            file: isLast ? file : null,
            children: {},
          };
        }
        current = current[part].children;
      });
    });

    return root;
  };

  const renderTree = (node: Record<string, any>, depth = 0) => {
    return Object.values(node).map((item: any) => (
      <div key={item.fullPath}>
        <div
          className={`file-tree-item ${currentFile?.id === item.file?.id ? 'active' : ''}`}
          style={{ paddingLeft: `${depth * 1 + 0.5}rem` }}
          onClick={() => {
            if (item.isDirectory) {
              toggleDir(item.fullPath);
            } else if (item.file) {
              onFileSelect(item.file);
            }
          }}
        >
          {item.isDirectory && (
            <span style={{ width: 16 }}>
              {expandedDirs.has(item.fullPath) ? '▼' : '▶'}
            </span>
          )}
          {!item.isDirectory && <span style={{ width: 16 }} />}
          <span>{getFileIcon(item.fullPath, item.isDirectory)}</span>
          <span>{item.name}</span>
        </div>

        {item.isDirectory && expandedDirs.has(item.fullPath) && (
          <div>{renderTree(item.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  const tree = buildTree(files);

  return (
    <div className="file-explorer">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowNewFile(!showNewFile)}
          title="New File"
          style={{ flex: 1 }}
        >
          + File
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowNewFolder(!showNewFolder)}
          title="New Folder"
          style={{ flex: 1 }}
        >
          + Folder
        </button>
      </div>

      {showNewFile && (
        <form onSubmit={createFile} style={{ marginBottom: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="filename.js"
            autoFocus
            style={{ fontSize: '0.85rem' }}
          />
        </form>
      )}

      {showNewFolder && (
        <form onSubmit={createFolder} style={{ marginBottom: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="folder-name"
            autoFocus
            style={{ fontSize: '0.85rem' }}
          />
        </form>
      )}

      <div className="file-tree">{renderTree(tree)}</div>
    </div>
  );
};
