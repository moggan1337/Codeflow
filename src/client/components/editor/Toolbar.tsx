import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '../../types';

interface ToolbarProps {
  projectId: string;
  onExecute: () => void;
  executionLanguage: string;
  onLanguageChange: (lang: string) => void;
  onToggleTerminal: () => void;
  onToggleComments: () => void;
  gitStatus: any;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  projectId,
  onExecute,
  executionLanguage,
  onLanguageChange,
  onToggleTerminal,
  onToggleComments,
  gitStatus,
}) => {
  const navigate = useNavigate();

  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar-left">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          ←
        </button>
        <span style={{ fontWeight: 500 }}>Project: {projectId.slice(0, 8)}</span>

        {gitStatus && (
          <div className="connection-status" style={{ marginLeft: '1rem' }}>
            <span
              className={`status-dot ${gitStatus.ahead > 0 || gitStatus.behind > 0 ? 'connecting' : 'connected'}`}
            />
            <span style={{ fontSize: '0.8rem' }}>
              {gitStatus.branch}
              {gitStatus.ahead > 0 && ` ↑${gitStatus.ahead}`}
              {gitStatus.behind > 0 && ` ↓${gitStatus.behind}`}
            </span>
          </div>
        )}
      </div>

      <div className="editor-toolbar-right">
        <select
          className="form-input"
          value={executionLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{ width: '140px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
        >
          {SUPPORTED_LANGUAGES.filter(l => l.supported && l.timeout > 0).map((lang) => (
            <option key={lang.name} value={lang.name}>
              {lang.displayName}
            </option>
          ))}
        </select>

        <button
          className="btn btn-primary btn-sm"
          onClick={onExecute}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Run
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onToggleTerminal}
          title="Toggle Terminal"
        >
          Terminal
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onToggleComments}
          title="Toggle Comments"
        >
          💬
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(`/project/${projectId}/settings`)}
          title="Project Settings"
        >
          ⚙
        </button>
      </div>
    </div>
  );
};
