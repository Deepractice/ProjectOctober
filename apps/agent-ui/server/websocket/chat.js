/**
 * Chat WebSocket Handler
 * Handles Agent AI chat connections and messages
 */
import { WebSocket } from 'ws';
import { queryAgentSDK, abortAgentSDKSession, isAgentSDKSessionActive, getActiveAgentSDKSessions } from '../agent-sdk.js';
import sessionManager from '../core/SessionManager.js';

export function handleChatConnection(ws, connectedClients) {
  console.log('💬 Chat WebSocket connected');

  // Add to connected clients for project updates
  connectedClients.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'agent-command') {
        console.log('💬 User message:', data.command || '[Continue/Resume]');
        console.log('📁 Project:', data.options?.projectPath || 'Unknown');
        console.log('🔄 Session:', data.options?.sessionId ? 'Resume' : 'New');

        const sessionId = data.options?.sessionId;

        try {
          // For resume sessions, mark as processing
          if (sessionId) {
            const session = sessionManager.getSession(sessionId);
            if (session && session.status === 'created') {
              sessionManager.startProcessing(sessionId);
              console.log('⚙️ Resumed session marked as processing:', sessionId);
            }
          }

          // Use Agent Agents SDK
          await queryAgentSDK(data.command, data.options, ws);

          // Mark session as completed
          if (sessionId) {
            sessionManager.completeSession(sessionId);
            console.log('✅ Session completed:', sessionId);
          }
        } catch (error) {
          // Mark session as error
          if (sessionId) {
            sessionManager.errorSession(sessionId, error);
            console.log('❌ Session error:', sessionId);
          }
          throw error;
        }
      } else if (data.type === 'abort-session') {
        console.log('🛑 Abort session request:', data.sessionId);
        // Use Agent Agents SDK
        const success = await abortAgentSDKSession(data.sessionId);

        // Notify SessionManager
        if (success) {
          sessionManager.abortSession(data.sessionId);
          console.log('🛑 SessionManager notified of abort:', data.sessionId);
        }

        ws.send(JSON.stringify({
          type: 'session-aborted',
          sessionId: data.sessionId,
          provider: 'claude',
          success
        }));
      } else if (data.type === 'check-session-status') {
        // Check if a specific session is currently processing
        const sessionId = data.sessionId;
        // Use Agent Agents SDK
        const isActive = isAgentSDKSessionActive(sessionId);

        ws.send(JSON.stringify({
          type: 'session-status',
          sessionId,
          provider: 'claude',
          isProcessing: isActive
        }));
      } else if (data.type === 'get-active-sessions') {
        // Get all currently active sessions
        const activeSessions = {
          claude: getActiveAgentSDKSessions()
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
