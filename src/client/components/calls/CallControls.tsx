import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editor';
import { useAuthStore } from '../../store/auth';

export const CallControls: React.FC = () => {
  const { callStatus, setCallStatus } = useEditorStore();
  const { user } = useAuthStore();
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setCallStatus({
        active: true,
        participants: [user?.id || ''],
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setCallStatus({
      active: false,
      participants: [],
    });

    setIsVideoOn(false);
    setIsAudioOn(true);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!callStatus.active) {
    return (
      <div className="call-ui">
        <button
          className="call-button video"
          onClick={startCall}
          title="Start Video Call"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23,7 16,12 23,17" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="call-ui" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
      <div
        style={{
          position: 'relative',
          width: 200,
          height: 150,
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          marginBottom: '0.5rem',
          border: '2px solid var(--color-primary)',
        }}
      >
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />
        {!isVideoOn && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-bg-tertiary)',
            }}
          >
            <span style={{ fontSize: '2rem' }}>
              {user?.username?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: '0.5rem',
            left: '0.5rem',
            fontSize: '0.7rem',
            background: 'rgba(0,0,0,0.5)',
            padding: '0.2rem 0.4rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {user?.username} (You)
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className={`call-button ${isAudioOn ? 'audio' : ''}`}
          onClick={toggleAudio}
          style={{
            background: !isAudioOn ? 'var(--color-error)' : undefined,
            color: !isAudioOn ? 'white' : undefined,
          }}
          title={isAudioOn ? 'Mute' : 'Unmute'}
        >
          {isAudioOn ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>

        <button
          className={`call-button ${isVideoOn ? 'video' : ''}`}
          onClick={toggleVideo}
          style={{
            background: !isVideoOn ? 'var(--color-error)' : undefined,
            color: !isVideoOn ? 'white' : undefined,
          }}
          title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoOn ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23,7 16,12 23,17" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>

        <button
          className="call-button end"
          onClick={endCall}
          title="End Call"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            <line x1="1" y1="1" x2="23" y2="23" transform="rotate(135 12 12)"/>
          </svg>
        </button>
      </div>
    </div>
  );
};
