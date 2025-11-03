/**
 * Sessions File Watcher
 * Monitors Agent project sessions folder and notifies clients of changes
 */
import path from 'path';
import { WebSocket } from 'ws';
import { getCurrentProject, getSessions } from '../projects.js';

let projectsWatcher = null;

export async function setupSessionsWatcher(connectedClients) {
  const chokidar = (await import('chokidar')).default;
  const project = getCurrentProject();
  const sessionPath = project.claudeProjectDir;

  if (projectsWatcher) {
    projectsWatcher.close();
  }

  try {
    // Initialize chokidar watcher with optimized settings
    projectsWatcher = chokidar.watch(sessionPath, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/*.tmp',
        '**/*.swp',
        '**/.DS_Store'
      ],
      persistent: true,
      ignoreInitial: true, // Don't fire events for existing files on startup
      followSymlinks: false,
      depth: 10, // Reasonable depth limit
      awaitWriteFinish: {
        stabilityThreshold: 100, // Wait 100ms for file to stabilize
        pollInterval: 50
      }
    });

    // Debounce function to prevent excessive notifications
    let debounceTimer;
    const debouncedUpdate = async (eventType, filePath) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          // Get updated sessions list (get up to 100 sessions)
          const updatedSessions = await getSessions(100);

          // Notify all connected clients about the session changes
          const updateMessage = JSON.stringify({
            type: 'sessions_updated',
            sessions: updatedSessions.sessions || [],
            timestamp: new Date().toISOString(),
            changeType: eventType,
            changedFile: path.relative(sessionPath, filePath)
          });

          connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(updateMessage);
            }
          });

        } catch (error) {
          console.error('❌ Error handling session changes:', error);
        }
      }, 300); // 300ms debounce (slightly faster than before)
    };

    // Set up event listeners
    projectsWatcher
      .on('add', (filePath) => debouncedUpdate('add', filePath))
      .on('change', (filePath) => debouncedUpdate('change', filePath))
      .on('unlink', (filePath) => debouncedUpdate('unlink', filePath))
      .on('addDir', (dirPath) => debouncedUpdate('addDir', dirPath))
      .on('unlinkDir', (dirPath) => debouncedUpdate('unlinkDir', dirPath))
      .on('error', (error) => {
        console.error('❌ Chokidar watcher error:', error);
      })
      .on('ready', () => {
        console.log('✅ Sessions watcher ready');
      });

  } catch (error) {
    console.error('❌ Failed to setup sessions watcher:', error);
  }
}

export function closeSessionsWatcher() {
  if (projectsWatcher) {
    projectsWatcher.close();
    projectsWatcher = null;
  }
}
