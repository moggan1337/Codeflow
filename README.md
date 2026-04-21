# Codeflow - Real-Time Collaborative Code Editor

[![npm version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/moggan1337/Codeflow)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> Transform your development workflow with real-time collaborative editing. Multiple developers, one codebase, zero merge conflicts.

## 🎬 Demo

![Codeflow Demo](demo.gif)

*Real-time collaborative editing with multiple cursors*

## ✨ Features

- **Real-time sync** - Changes propagate instantly across all connected clients
- **Conflict resolution** - Intelligent merging without manual intervention
- **Presence awareness** - See who's online and where they're working
- **Session sharing** - Generate shareable links for pair programming
- **Code reviews** - Inline comments and suggestions in real-time

## 🚀 Quick Start

```bash
npm install -g @moggan1337/codeflow
codeflow init my-project
cd my-project
codeflow start
```

## 🎨 Live Collaboration Demo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CODEFLOW COLLABORATION SESSION                      │
│                              session: proj-alpha-7x4k                       │
└─────────────────────────────────────────────────────────────────────────────┘

     👤 alice (you)              👤 bob                   👤 charlie
     📍 src/auth/login.ts        📍 src/api/users.ts      📍 src/db/schema.ts
     
     ┌────────────────────────────────────────────────────────────────────┐
     │  src/auth/login.ts                    [●] alice  [○] bob  [●]charlie │
     ├────────────────────────────────────────────────────────────────────┤
     │   1 │ import { auth } from '@/core';                              │
     │   2 │ import { validateToken } from './token';  ←── 👤 bob typing │
     │   3 │                                                        │
     │   4 │ export async function login(req: Request) {              │
     │   5 │   const { email, password } = req.body;                  │
     │   6 │   ┌──────────────────────────────────┐                   │
     │   7 │   │ const user = await db.users     │ ←── 👤 alice cursor
     │   8 │   │   .findOne({ email })           │                   │
     │   9 │   │   .select('+password');         │                   │
     │  10 │   └──────────────────────────────────┘                   │
     │  11 │                                                       │
     │  12 │   if (!user) throw AuthError.InvalidCredentials();      │
     │  13 │   ┌──────────────────────────────────┐                   │
     │  14 │   │ return createSession(user.id);  │ ←── 👤 charlie      │
     │  15 │   └──────────────────────────────────┘                   │
     │  16 │ }                                                        │
     └────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ [Chat] alice → team: "Almost done with the auth fix! 🎉"                   │
│         bob: "Nice! I'll review once you push"                              │
│      charlie: " schema looks good, just added indexes"                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Live Activity Feed

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            LIVE ACTIVITY FEED                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ● alice edited   src/auth/login.ts              2s ago                     │
│  ● bob edited     src/api/users.ts              15s ago                     │
│  ● charlie saved  src/db/schema.ts              32s ago                     │
│  ● alice joined   session                       1m ago                      │
│  ● bob joined     session                       2m ago                      │
│  ● charlie joined session                       3m ago                      │
│                                                                              │
│  ⚡ 3 collaborators online • 12 files open • 47 changes today                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Conflict Resolution Demo

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     CONFLICT RESOLUTION                                     │
│                   (Automatic Smart Merge)                                  │
└──────────────────────────────────────────────────────────────────────────────┘

  BEFORE MERGE                          AFTER MERGE (Codeflow)
  ────────────                          ────────────────────
  
  alice writes:                          ┌─────────────────────┐
  ┌─────────────────┐                    │ let maxRetries = 3; │
  │ let maxRetries  │                    │ let timeout = 5000; │
  │   = 3;          │                    │ // Increased for    │
  └─────────────────┘                    │ // slow networks    │
                                          └─────────────────────┘
  
  bob writes:                            ✨ Auto-merged!
  ┌─────────────────┐
  │ let maxRetries  │
  │   = 5;          │
  │ let timeout =   │
  │   5000;         │
  └─────────────────┘

  ⚡ Codeflow analyzed both changes, kept maxRetries=5 from bob
     (higher value), and combined timeout=5000 from alice's comment
```

### Multi-Cursor Demonstration

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         MULTI-CURSOR EDITING                                │
└──────────────────────────────────────────────────────────────────────────────┘

     Viewing: src/utils/validators.ts

     ┌────────────────────────────────────────────────────────────────────┐
     │  1 │ export const validators = {                                  │
     │  2 │   email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),        │
     │  3 │   url: (v) => /^https?:\/\/.+/.test(v),                      │
     │  4 │   phone: (v) => /^\+?[\d\s-]{10,}$/.test(v),                │
     │  5 │   zip: (v) => /^\d{5}(-\d{4})?$/.test(v),                    │
     │  6 │ };                                                           │
     │ 7  │                                                              │
     │  8 │ // TODO: Add validators for: postal, currency, credit_card   │
     │    │          ↑ Selected by 👤 alice                               │
     └────────────────────────────────────────────────────────────────────┘

  👤 alice selects "TODO:" line
  👤 bob selects all .test(v) calls in lines 2-5
  
  [Ctrl+Shift+L] - Select all occurrences
  
  Result: Alice and Bob both have selections for bulk editing! 🚀
```

## 📊 Session Statistics

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           SESSION STATISTICS                                 │
│                          session: proj-alpha-7x4k                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Files Modified    ████████████████████████░░░░░  24 / 30                   │
│   Lines Changed     ██████████████████░░░░░░░░░░░  1,247 / 2,000              │
│   Comments Added    ████░░░░░░░░░░░░░░░░░░░░░░░░     47                     │
│   Reviews Requested ████████░░░░░░░░░░░░░░░░░░░░    12                     │
│                                                                              │
│   Active Time: 2h 34m    │    Collaborators: 3    │    Commands Run: 18      │
│                                                                              │
│   💬 Chat Messages: 47    │    📋 Tasks Done: 8    │    🐛 Bugs Fixed: 3     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 🛠️ Installation

```bash
# Using npm
npm install -g @moggan1337/codeflow

# Using yarn
yarn global add @moggan1337/codeflow

# Using pnpm
pnpm add -g @moggan1337/codeflow
```

## 📖 Usage

```bash
# Start a new collaborative session
codeflow start

# Join an existing session
codeflow join proj-alpha-7x4k

# Share your session
codeflow share

# Invite collaborators
codeflow invite alice@example.com bob@example.com
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT © 2024 moggan1337
