import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketHandlers } from './socket/handlers.js';
import { authRouter } from './routes/auth.js';
import { projectRouter } from './routes/projects.js';
import { gitRouter } from './routes/git.js';
import { codeExecutionRouter } from './routes/execution.js';
import { collaborationRouter } from './routes/collaboration.js';
import { initializeDatabase } from './services/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../../public')));

app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/git', gitRouter);
app.use('/api/execute', codeExecutionRouter);
app.use('/api/collaboration', collaborationRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const io = new SocketServer(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

setupSocketHandlers(io);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Codeflow server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   WebSocket: Enabled`);
      console.log(`   CORS: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, httpServer, io };
