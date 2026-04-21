import React from 'react';
import { useEditorStore } from '../../store/editor';

interface TerminalProps {
  onClose: () => void;
  onClear: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ onClose, onClear }) => {
  const { terminalOutput } = useEditorStore();

  return (
    <div className="terminal-panel">
      <div className="terminal-header">
        <span style={{ fontWeight: 500 }}>Terminal</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClear}
            title="Clear Terminal"
          >
            Clear
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            title="Close Terminal"
          >
            ×
          </button>
        </div>
      </div>
      <div className="terminal-content">
        {terminalOutput.length === 0 ? (
          <span style={{ color: 'var(--color-text-muted)' }}>
            Run code to see output here...
          </span>
        ) : (
          terminalOutput.map((line, index) => (
            <div key={index}>{line}</div>
          ))
        )}
      </div>
    </div>
  );
};
