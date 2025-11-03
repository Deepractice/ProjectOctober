/**
 * Express Application Configuration
 * Sets up middleware, routes, and static file serving
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import mcpRoutes from './routes/mcp.js';
import commandsRoutes from './routes/commands.js';
import sessionsRoutes from './routes/sessions.js';
import projectRoutes from './routes/project.js';
import systemRoutes from './routes/system.js';
import mediaRoutes from './routes/media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp(wss) {
  const app = express();

  // Make WebSocket server available to routes
  app.locals.wss = wss;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.use('/api/mcp', mcpRoutes);
  app.use('/api/commands', commandsRoutes);
  app.use('/api/sessions', sessionsRoutes);
  app.use('/api/project', projectRoutes);
  app.use('/api', systemRoutes);
  app.use('/api', mediaRoutes);

  // Serve public files (like api-docs.html)
  app.use(express.static(path.join(__dirname, '../public')));

  // Static files served after API routes
  // Add cache control: HTML files should not be cached, but assets can be cached
  app.use(express.static(path.join(__dirname, '../dist'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        // Prevent HTML caching to avoid service worker issues after builds
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)) {
        // Cache static assets for 1 year (they have hashed names)
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Serve React app for all other routes (excluding static files)
  app.get('*', (req, res) => {
    // Skip requests for static assets (files with extensions)
    if (path.extname(req.path)) {
      return res.status(404).send('Not found');
    }

    // Only serve index.html for HTML routes, not for static assets
    // Static assets should already be handled by express.static middleware above
    const indexPath = path.join(__dirname, '../dist/index.html');

    // Check if dist/index.html exists (production build available)
    if (fs.existsSync(indexPath)) {
      // Set no-cache headers for HTML to prevent service worker issues
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(indexPath);
    } else {
      // In development, redirect to Vite dev server only if dist doesn't exist
      res.redirect(`http://localhost:${process.env.VITE_PORT || 5173}`);
    }
  });

  return app;
}
