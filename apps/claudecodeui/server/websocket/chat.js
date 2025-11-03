/**
 * Chat WebSocket Handler
 * Handles Claude AI chat connections and messages
 */
import { WebSocket } from 'ws';
import { queryClaudeSDK, abortClaudeSDKSession, isClaudeSDKSessionActive, getActiveClaudeSDKSessions } from '../claude-sdk.js';

export function handleChatConnection(ws, connectedClients) {
  console.log('💬 Chat WebSocket connected');

  // Add to connected clients for project updates
  connectedClients.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'claude-command') {
        console.log('💬 User message:', data.command || '[Continue/Resume]');
        console.log('📁 Project:', data.options?.projectPath || 'Unknown');
        console.log('🔄 Session:', data.options?.sessionId ? 'Resume' : 'New');

        // Use Claude Agents SDK
        await queryClaudeSDK(data.command, data.options, ws);
      } else if (data.type === 'abort-session') {
        console.log('🛑 Abort session request:', data.sessionId);
        // Use Claude Agents SDK
        const success = await abortClaudeSDKSession(data.sessionId);

        ws.send(JSON.stringify({
          type: 'session-aborted',
          sessionId: data.sessionId,
          provider: 'claude',
          success
        }));
      } else if (data.type === 'check-session-status') {
        // Check if a specific session is currently processing
        const sessionId = data.sessionId;
        // Use Claude Agents SDK
        const isActive = isClaudeSDKSessionActive(sessionId);

        ws.send(JSON.stringify({
          type: 'session-status',
          sessionId,
          provider: 'claude',
          isProcessing: isActive
        }));
      } else if (data.type === 'get-active-sessions') {
        // Get all currently active sessions
        const activeSessions = {
          claude: getActiveClaudeSDKSessions()
        };
        ws.send(JSON.stringify({
          type: 'active-sessions',
          sessions: activeSessions
        }));
      }
    } catch (error) {
      console.error('❌ Chat WebSocket error:', error.message);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 Chat client disconnected');
    // Remove from connected clients
    connectedClients.delete(ws);
  });
}
