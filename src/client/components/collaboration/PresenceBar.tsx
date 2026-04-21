import React from 'react';
import { UserPresence } from '../../types';

interface PresenceBarProps {
  presences: UserPresence[];
  isConnected: boolean;
}

export const PresenceBar: React.FC<PresenceBarProps> = ({ presences, isConnected }) => {
  return (
    <div className="presence-bar">
      <div className="connection-status">
        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
        {presences.slice(0, 5).map((presence, index) => (
          <div
            key={presence.id}
            className="presence-avatar"
            style={{
              backgroundColor: presence.color,
              zIndex: presences.length - index,
            }}
            title={`${presence.name}`}
          >
            {presence.name?.[0]?.toUpperCase() || '?'}
          </div>
        ))}

        {presences.length > 5 && (
          <div
            className="presence-avatar"
            style={{ backgroundColor: 'var(--color-bg-tertiary)', zIndex: 0 }}
            title={`${presences.length - 5} more users`}
          >
            +{presences.length - 5}
          </div>
        )}

        <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          {presences.length} online
        </span>
      </div>
    </div>
  );
};
