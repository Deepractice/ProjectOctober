/**
 * Express Application Configuration
 * API service with production static file serving
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import mcpRoutes from './routes/mcp.js';
import commandsRoutes from './routes/commands.js';
import sessionsRoutes from './routes/sessions.js';
import projectRoutes from './routes/project.js';
import systemRoutes from './routes/system.js';
import mediaRoutes from './routes/media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // API Routes (must be before static files)
  app.use('/api/mcp', mcpRoutes);
  app.use('/api/commands', commandsRoutes);
  app.use('/api/sessions', sessionsRoutes);
  app.use('/api/project', projectRoutes);
  app.use('/api', projectRoutes);
  app.use('/api', systemRoutes);
  app.use('/api', mediaRoutes);

  // Static files in production
  const distPath = path.join(__dirname, '../dist');
  const isProduction = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProduction) {
    console.log('📦 Serving static files from:', distPath);

    // Serve static assets with cache
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true,
      index: false // Don't auto-serve index.html for directory requests
    }));

    // SPA fallback for all non-API routes
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development: 404 for undefined routes
    app.use((_req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  return app;
}
