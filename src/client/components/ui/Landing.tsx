import React from 'react';
import { Link } from 'react-router-dom';

export const Landing: React.FC = () => {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <a href="/" className="landing-logo">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="currentColor"/>
            <path d="M8 12L14 16L8 20V12Z" fill="white"/>
            <path d="M16 8L24 16L16 24V8Z" fill="white" fillOpacity="0.7"/>
          </svg>
          Codeflow
        </a>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-ghost">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <h1>Real-Time Collaborative Code Editor</h1>
        <p>
          Build software together with your team. Edit code simultaneously,
          see changes in real-time, and never worry about merge conflicts again.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/register" className="btn btn-primary btn-lg">Start Building</Link>
          <a href="#features" className="btn btn-secondary btn-lg">Learn More</a>
        </div>
      </section>

      <section id="features" className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h3>Real-Time Collaboration</h3>
          <p>
            Edit code with your team in real-time. See cursors, selections,
            and changes as they happen with sub-100ms latency.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9h6v6H9z"/>
            </svg>
          </div>
          <h3>CRDT-Based Sync</h3>
          <p>
            Built on Conflict-free Replicated Data Types for seamless
            offline editing and automatic conflict resolution.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h3>WebRTC P2P</h3>
          <p>
            Direct peer-to-peer connections for video, voice, and data
            transfer. Minimal server involvement for maximum privacy.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16,18 22,12 16,6"/>
              <polyline points="8,6 2,12 8,18"/>
            </svg>
          </div>
          <h3>50+ Languages</h3>
          <p>
            Full syntax highlighting for 50+ programming languages
            powered by Monaco Editor.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h3>Code Execution</h3>
          <p>
            Run code directly in the browser with support for
            multiple languages and instant results.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>Inline Comments</h3>
          <p>
            Leave comments on specific lines of code for better
            code review and async collaboration.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h3>Git Integration</h3>
          <p>
            Branch, commit, and manage pull requests without
            leaving your editor.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>Video & Voice</h3>
          <p>
            Integrated video and voice chat powered by WebRTC.
            Collaborate face-to-face without switching apps.
          </p>
        </div>
      </section>

      <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-light)' }}>
        <p>&copy; 2024 Codeflow. Built with ❤️ for developers.</p>
      </footer>
    </div>
  );
};
