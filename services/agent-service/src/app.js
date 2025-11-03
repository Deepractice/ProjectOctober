/**
 * Express Application Configuration
 * Pure API service (no static file serving)
 */
import express from 'express';
import cors from 'cors';

import mcpRoutes from './routes/mcp.js';
import commandsRoutes from './routes/commands.js';
import sessionsRoutes from './routes/sessions.js';
import projectRoutes from './routes/project.js';
import systemRoutes from './routes/system.js';
import mediaRoutes from './routes/media.js';

export function createApp(wss) {
  const app = express();

  // Make WebSocket server available to routes
  app.locals.wss = wss;

  // CORS - Allow frontend origin
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'agent-service' });
  });

  // API Routes
  app.use('/api/mcp', mcpRoutes);
  app.use('/api/commands', commandsRoutes);
  app.use('/api/sessions', sessionsRoutes);
  app.use('/api/project', projectRoutes);
  // Mount projectRoutes also at /api for backward compatibility
  app.use('/api', projectRoutes);
  app.use('/api', systemRoutes);
  app.use('/api', mediaRoutes);

  // 404 for undefined routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  return app;
}
