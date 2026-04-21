# Codeflow - Real-Time Collaborative Code Editor
## 🎬 Demo
![Codeflow Demo](demo.gif)

*Real-time collaborative editing with multiple cursors*

## Screenshots
| Component | Preview |
|-----------|---------|
| Multiplayer Editor | ![editor](screenshots/editor.png) |
| User Presence | ![presence](screenshots/presence.png) |
| Sync Status | ![sync](screenshots/sync-status.png) |

## Visual Description
Editor shows multiple colored cursors moving and typing simultaneously. User presence lists connected collaborators with selections. Sync indicator shows CRDT merge operations with timestamps.

---



[![CI](https://github.com/moggan1337/Codeflow/actions/workflows/ci.yml/badge.svg)](https://github.com/moggan1337/Codeflow/actions/workflows/ci.yml)

![Codeflow Banner](https://img.shields.io/badge/Codeflow-Real--Time%20Collab-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Node](https://img.shields.io/badge/Node.js-20+-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

Codeflow is a powerful, real-time collaborative code editor built with modern web technologies. It enables multiple developers to work on the same codebase simultaneously with conflict-free synchronization, integrated video/voice communication, and comprehensive code execution capabilities.

## 🌟 Features

### Core Collaboration Features

- **CRDT-Based Conflict Resolution**: Built on Yjs (YATA algorithm) for seamless offline editing and automatic conflict resolution
- **Real-Time Synchronization**: Sub-100ms latency for text changes, cursor positions, and selections
- **Multi-Cursor Presence**: See other users' cursors and selections in real-time with color-coded indicators
- **WebRTC Peer-to-Peer Communication**: Direct P2P connections for video, voice, and data transfer

### Code Editor

- **Monaco Editor Integration**: Full VS Code editing experience in the browser
- **50+ Programming Languages**: Comprehensive syntax highlighting for all major languages
- **Intelligent Code Completion**: Context-aware suggestions and auto-completion
- **Multi-Tab File Management**: Open and edit multiple files simultaneously

### Code Execution

- **In-Browser Code Execution**: Run code directly without leaving the editor
- **Multi-Language Support**: JavaScript, Python, TypeScript, Java, C++, Go, Rust, and more
- **Real-Time Output**: Instant feedback with stdout/stderr capture
- **Execution History**: Track all code executions with results and timing

### Git Integration

- **Branch Management**: Create, switch, and manage branches
- **Commit Tracking**: Full commit history with author and message
- **File Status**: Visual indicators for modified, staged, and untracked files
- **Diff Viewer**: Compare changes between commits

### Code Review

- **Inline Comments**: Leave comments on specific lines of code
- **Threaded Discussions**: Reply to comments for focused conversations
- **Resolve/Unresolve**: Track comment resolution status
- **File-Level Comments**: General feedback at the file level

### Communication

- **Video Chat**: Integrated WebRTC video calls
- **Voice Chat**: Real-time audio communication
- **Screen Sharing Ready**: Architecture prepared for screen sharing
- **Connection Status**: Visual indicators for presence and connectivity

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   React     │  │   Monaco    │  │    Yjs      │             │
│  │     UI      │  │   Editor    │  │   CRDT      │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                        │
│                    ┌─────┴─────┐                                  │
│                    │  Socket   │                                  │
│                    │   Client  │                                  │
│                    └─────┬─────┘                                  │
└──────────────────────────┼────────────────────────────────────────┘
                           │ WebSocket
┌──────────────────────────┼────────────────────────────────────────┐
│                    Server Layer                                   │
├──────────────────────────┼────────────────────────────────────────┤
│                    ┌─────┴─────┐                                  │
│                    │  Socket   │                                  │
│                    │   Server  │                                  │
│                    └─────┬─────┘                                  │
│         ┌────────────────┼────────────────┐                      │
│         │                │                │                      │
│  ┌──────┴──────┐  ┌───────┴───────┐  ┌────┴────┐                │
│  │   Yjs       │  │   Express     │  │  Media  │                │
│  │   Server    │  │   REST API    │  │  Server │                │
│  └─────────────┘  └───────────────┘  └─────────┘                │
│         │                                                               │
│  ┌──────┴──────┐                                                     │
│  │  SQLite    │                                                     │
│  │  Database  │                                                     │
│  └────────────┘                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | React 18 | UI Components & State Management |
| **Code Editor** | Monaco Editor | VS Code's editor in the browser |
| **CRDT Library** | Yjs | Conflict-free replicated data types |
| **WebSocket Provider** | y-websocket | Real-time sync provider |
| **Backend Framework** | Express.js | REST API & WebSocket server |
| **Database** | SQLite (better-sqlite3) | Persistent storage |
| **Real-Time** | Socket.IO | WebSocket abstraction |
| **Video/Audio** | WebRTC | Peer-to-peer media streams |
| **Language Detection** | Custom mappings | 50+ language support |
| **Styling** | CSS Variables | Consistent theming |

## 📐 CRDT Implementation

### What is CRDT?

Conflict-free Replicated Data Types (CRDTs) are data structures that can be replicated across multiple nodes and updated independently without coordination between nodes. All replicas converge to the same state regardless of the order of updates.

### Yjs Architecture

Codeflow uses **Yjs** with the **YATA (Yet Another Transformation Approach)** algorithm for text synchronization:

```typescript
// Simplified CRDT Document Structure
interface CRDTDocument {
  doc: Y.Doc;           // The Yjs document
  awareness: Awareness; // User presence/cursor tracking
  operations: Operation[]; // Operation history
}

// Operation types in Codeflow
type Operation = 
  | { type: 'insert', position: number, content: string }
  | { type: 'delete', position: number, length: number }
  | { type: 'retain', count: number };
```

### Operational Transformation vs CRDT

| Aspect | Operational Transformation (OT) | CRDT (Yjs/YATA) |
|--------|--------------------------------|-----------------|
| **Coordination** | Requires server for transformation | Server only stores/shares |
| **Offline Support** | Limited | Full offline support |
| **Complexity** | O(n²) for n concurrent users | O(log n) per operation |
| **Server Trust** | Server must be honest | Server can be untrusted |
| **Network** | Synchronous | Asynchronous |

### How Codeflow Uses CRDT

1. **Document Initialization**
   ```typescript
   const ydoc = new Y.Doc();
   const text = ydoc.getText('content');
   const provider = new WebsocketProvider(wsUrl, documentId, ydoc);
   ```

2. **Local Changes**
   ```typescript
   // User types - creates local operation
   text.insert(position, 'hello');
   
   // Yjs automatically creates operation with:
   // - Unique client ID
   // - Logical clock
   // - Operation type and parameters
   ```

3. **Remote Changes**
   ```typescript
   // Server receives operation from another client
   // Broadcasts to all other clients
   // Each client applies operation locally
   // All clients converge to same state
   ```

4. **Conflict Resolution**
   ```typescript
   // If two users edit same position:
   // 1. Both operations are stored
   // 2. YATA algorithm orders by:
   //    - Client ID (deterministic)
   //    - Clock value (operation count)
   // 3. Result: deterministic ordering regardless of arrival order
   ```

### Awareness Protocol

The Awareness protocol tracks user presence without storing in the CRDT document:

```typescript
interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor?: { lineNumber: number; column: number };
  selection?: SelectionRange;
  lastActivity: number;
}

// Each client broadcasts their state to all peers
awareness.setLocalState({
  user: { id, name, color, cursor, selection }
});

// All clients receive updates and render remote cursors
awareness.on('change', ({ added, updated, removed }) => {
  // Update UI with new/modified/removed users
});
```

## 🔄 Real-Time Synchronization

### WebSocket Connection Flow

```
Client A                 Server                  Client B
   │                        │                        │
   │──── Join Document ────▶│                        │
   │◀─── Sync State ────────│                        │
   │                        │                        │
   │     [User types...]    │                        │
   │──── Update ────────────▶│                        │
   │◀─── Broadcast ─────────│──── Remote Update ─────▶│
   │                        │                        │
   │     [Cursor moves...]   │                        │
   │──── Cursor ────────────▶│──── Cursor Broadcast ─▶│
   │                        │                        │
   │◀──────────────────────────── Presence Update ────│
```

### Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `join-document` | Client → Server | Request to join a document session |
| `document-sync` | Server → Client | Initial state of the document |
| `update` | Client → Server | Local operation/broadcast |
| `remote-update` | Server → Client | Propagated operation |
| `cursor-move` | Client → Server | Cursor position update |
| `remote-cursor` | Server → Client | Other users' cursors |
| `selection-change` | Client → Server | Selection range update |
| `awareness-update` | Bidirectional | Presence/awareness changes |
| `request-sync` | Client → Server | Request state sync |
| `sync-update` | Server → Client | Full state update |

### Connection Management

```typescript
// Automatic reconnection with exponential backoff
const provider = new WebsocketProvider(wsUrl, documentId, ydoc, {
  connect: true,
  resyncInterval: 10000,      // Check connection every 10s
  maxBackoffTime: 2500,       // Max backoff: 2.5s
  disableBc: false,           // Enable broadcast channels
});

// Connection status handling
provider.on('status', (event: { status: string }) => {
  // event.status: 'connecting' | 'connected' | 'disconnected'
  updateConnectionUI(event.status);
});

// Sync status handling
provider.on('sync', (isSynced: boolean) => {
  // true: local state matches server state
  // false: still syncing
  updateSyncIndicator(isSynced);
});
```

### State Synchronization

1. **Initial Sync**: Client requests state, server sends encoded document
2. **Incremental Updates**: Only changed operations are transmitted
3. **Garbage Collection**: Old operations cleaned based on vector clock
4. **Snapshot Updates**: Periodic full state for new clients

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/moggan1337/Codeflow.git
cd Codeflow

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development servers
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

### Environment Variables

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=./data/codeflow.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# WebRTC Configuration
STUN_SERVER_URL=stun:stun.l.google.com:19302

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 📁 Project Structure

```
codeflow/
├── src/
│   ├── server/
│   │   ├── index.ts                 # Express server entry point
│   │   ├── crdt/
│   │   │   ├── collaboration-manager.ts  # CRDT state management
│   │   │   └── operations.ts          # OT/CRDT operations
│   │   ├── socket/
│   │   │   └── handlers.ts           # WebSocket event handlers
│   │   ├── routes/
│   │   │   ├── auth.ts              # Authentication routes
│   │   │   ├── projects.ts         # Project management
│   │   │   ├── git.ts               # Git operations
│   │   │   ├── execution.ts         # Code execution
│   │   │   └── collaboration.ts     # Comments & presence
│   │   ├── services/
│   │   │   └── database.ts          # SQLite database setup
│   │   └── middleware/
│   │       └── auth.ts              # JWT authentication
│   │
│   └── client/
│       ├── main.tsx                 # React entry point
│       ├── App.tsx                  # Router & main app
│       ├── types/
│       │   └── index.ts             # TypeScript types
│       ├── store/
│       │   ├── auth.ts              # Auth state (Zustand)
│       │   └── editor.ts            # Editor state (Zustand)
│       ├── styles/
│       │   └── global.css           # Global styles
│       └── components/
│           ├── ui/
│           │   ├── Landing.tsx      # Landing page
│           │   ├── Login.tsx        # Login page
│           │   ├── Register.tsx     # Registration page
│           │   ├── Dashboard.tsx    # Projects dashboard
│           │   └── ProjectSettings.tsx
│           ├── editor/
│           │   ├── EditorPage.tsx   # Main editor
│           │   ├── Toolbar.tsx      # Editor toolbar
│           │   ├── FileExplorer.tsx # File tree
│           │   └── Terminal.tsx     # Output terminal
│           ├── collaboration/
│           │   └── PresenceBar.tsx  # User presence
│           ├── review/
│           │   └── CommentsPanel.tsx # Code comments
│           └── calls/
│               └── CallControls.tsx # Video/voice controls
│
├── public/
│   └── favicon.svg
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── README.md
```

## 🔧 API Reference

### Authentication

#### POST /api/auth/register
Register a new user account.

```json
// Request
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123",
  "displayName": "John Doe"
}

// Response
{
  "user": { "id": "...", "email": "...", "username": "..." },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/login
Authenticate an existing user.

```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "user": { "id": "...", "email": "...", "username": "..." },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Projects

#### GET /api/projects
List all accessible projects.

#### POST /api/projects
Create a new project.

```json
{
  "name": "My Project",
  "description": "Project description",
  "visibility": "private"
}
```

#### GET /api/projects/:id
Get project details with members.

#### PUT /api/projects/:id
Update project settings.

#### DELETE /api/projects/:id
Delete a project (owner only).

### Files

#### GET /api/projects/:id/files
List all files in a project.

#### POST /api/projects/:id/files
Create a new file.

```json
{
  "path": "/src/main.js",
  "content": "// code here",
  "language": "javascript",
  "isDirectory": false
}
```

#### PUT /api/projects/:id/files/:fileId
Update file content.

### Code Execution

#### POST /api/execute/run
Execute code in a sandboxed environment.

```json
// Request
{
  "code": "console.log('Hello, World!')",
  "language": "javascript",
  "projectId": "project-id"
}

// Response
{
  "executionId": "exec-123",
  "result": {
    "stdout": "Hello, World!\n",
    "stderr": "",
    "exitCode": 0
  },
  "executionTime": 45
}
```

### Git Operations

#### GET /api/git/:projectId/status
Get current git status.

```json
{
  "status": {
    "branch": "main",
    "ahead": 2,
    "behind": 0,
    "modified": ["src/index.ts"],
    "staged": [],
    "untracked": ["new-file.js"]
  }
}
```

#### POST /api/git/:projectId/commit
Create a commit.

```json
{
  "message": "feat: add new feature",
  "files": ["src/index.ts"]
}
```

#### POST /api/git/:projectId/branches
Create a new branch.

```json
{
  "name": "feature/new-feature",
  "fromBranch": "main"
}
```

### Comments

#### GET /api/collaboration/:projectId/comments
Get all comments for a project.

#### POST /api/collaboration/:projectId/comments
Create a new comment.

```json
{
  "fileId": "file-id",
  "content": "Consider refactoring this function",
  "lineStart": 42,
  "lineEnd": 42
}
```

#### POST /api/collaboration/:projectId/comments/:commentId/resolve
Resolve or unresolve a comment.

## 🔒 Security

### Authentication

- JWT-based authentication with configurable expiration
- Passwords hashed with bcrypt (cost factor 12)
- HTTP-only considerations for production deployment

### Authorization

- Project-level access control (owner, members, public)
- Role-based permissions (owner, admin, editor, viewer)
- File-level operations require project membership

### Data Protection

- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- CORS configuration for cross-origin control
- Rate limiting on sensitive endpoints

### Production Recommendations

```env
# Use strong JWT secrets
JWT_SECRET=<64-byte-random-string>

# Enable HTTPS
NODE_ENV=production

# Configure reverse proxy (nginx)
# - WebSocket upgrade support
# - SSL/TLS termination
# - Rate limiting
# - DDoS protection
```

## 🌐 WebRTC Implementation

### Connection Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    WebRTC Signaling Flow                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  User A                          User B                        │
│     │                               │                         │
│     │──── Offer (SDP) ─────────────▶│                        │
│     │                               │                         │
│     │◀─── Answer (SDP) ────────────│                        │
│     │                               │                         │
│     │◀──── ICE Candidates ◀────────│                        │
│     │──── ICE Candidates ──────────▶│                        │
│     │                               │                         │
│     │══════════ Direct P2P ══════════│                        │
│     │     Video/Audio/Data Stream    │                        │
│     │                               │                         │
└──────────────────────────────────────────────────────────────┘
```

### Media Constraints

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});
```

### Data Channels

```typescript
// Create data channel for low-latency messaging
const dataChannel = peerConnection.createDataChannel('chat', {
  ordered: true,  // Messages arrive in order
});

// Handle messages
dataChannel.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleCollaborativeUpdate(data);
};
```

## 🎨 Customization

### Theme Configuration

Codeflow uses CSS variables for theming:

```css
:root {
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-text-primary: #f8fafc;
  /* ... more variables */
}
```

### Language Support

Languages are mapped from file extensions:

```typescript
const extensionMap: Record<string, string> = {
  js: 'javascript',
  py: 'python',
  ts: 'typescript',
  // ... 50+ mappings
};
```

## 📊 Performance Considerations

### Client-Side

- **Monaco Editor**: Lazy-loaded on first editor open
- **Virtual Scrolling**: For large file trees
- **Debounced Updates**: Cursor position updates debounced to 50ms
- **Web Workers**: CRDT operations can be offloaded

### Server-Side

- **Connection Pooling**: WebSocket connections managed efficiently
- **Redis (Production)**: For multi-server deployment
- **Database Indexes**: Optimized queries
- **Message Batching**: Aggregate small updates

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test -- --coverage
```

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Yjs](https://github.com/yjs/yjs) - CRDT implementation
- [Monaco Editor](https://github.com/microsoft/monaco-editor) - Code editor
- [Socket.IO](https://socket.io/) - Real-time communication
- [PeerJS](https://peerjs.com/) - WebRTC abstraction
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [React](https://react.dev/) - UI framework

---

Built with ❤️ by the Codeflow Team
