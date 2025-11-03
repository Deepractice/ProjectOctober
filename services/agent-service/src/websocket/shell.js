/**
 * Shell WebSocket Handler
 * Handles terminal shell connections and PTY management
 */
import os from 'os';
import pty from 'node-pty';
import { WebSocket } from 'ws';

export function handleShellConnection(ws) {
  console.log('🐚 Shell client connected');
  let shellProcess = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Shell message received:', data.type);

      if (data.type === 'init') {
        // Initialize shell with project path and session info
        const projectPath = data.projectPath || process.cwd();
        const sessionId = data.sessionId;
        const hasSession = data.hasSession;
        const provider = data.provider || 'claude';
        const initialCommand = data.initialCommand;
        const isPlainShell = data.isPlainShell || (!!initialCommand && !hasSession) || provider === 'plain-shell';

        console.log('🚀 Starting shell in:', projectPath);
        console.log('📋 Session info:', hasSession ? `Resume session ${sessionId}` : (isPlainShell ? 'Plain shell mode' : 'New session'));
        console.log('🤖 Provider:', isPlainShell ? 'plain-shell' : provider);
        if (initialCommand) {
          console.log('⚡ Initial command:', initialCommand);
        }

        // First send a welcome message
        let welcomeMsg;
        if (isPlainShell) {
          welcomeMsg = `\x1b[36mStarting terminal in: ${projectPath}\x1b[0m\r\n`;
        } else {
          welcomeMsg = hasSession ?
            `\x1b[36mResuming Agent session ${sessionId} in: ${projectPath}\x1b[0m\r\n` :
            `\x1b[36mStarting new Agent session in: ${projectPath}\x1b[0m\r\n`;
        }

        ws.send(JSON.stringify({
          type: 'output',
          data: welcomeMsg
        }));

        try {
          // Prepare the shell command adapted to the platform and provider
          let shellCommand;
          if (isPlainShell) {
            // Plain shell mode - just run the initial command in the project directory
            if (os.platform() === 'win32') {
              shellCommand = `Set-Location -Path "${projectPath}"; ${initialCommand}`;
            } else {
              shellCommand = `cd "${projectPath}" && ${initialCommand}`;
            }
          } else {
            // Use claude command (default) or initialCommand if provided
            const command = initialCommand || 'claude';
            if (os.platform() === 'win32') {
              if (hasSession && sessionId) {
                // Try to resume session, but with fallback to new session if it fails
                shellCommand = `Set-Location -Path "${projectPath}"; claude --resume ${sessionId}; if ($LASTEXITCODE -ne 0) { claude }`;
              } else {
                shellCommand = `Set-Location -Path "${projectPath}"; ${command}`;
              }
            } else {
              if (hasSession && sessionId) {
                shellCommand = `cd "${projectPath}" && claude --resume ${sessionId} || claude`;
              } else {
                shellCommand = `cd "${projectPath}" && ${command}`;
              }
            }
          }

          console.log('🔧 Executing shell command:', shellCommand);

          // Use appropriate shell based on platform
          const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
          const shellArgs = os.platform() === 'win32' ? ['-Command', shellCommand] : ['-c', shellCommand];

          shellProcess = pty.spawn(shell, shellArgs, {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME || (os.platform() === 'win32' ? process.env.USERPROFILE : '/'),
            env: {
              ...process.env,
              TERM: 'xterm-256color',
              COLORTERM: 'truecolor',
              FORCE_COLOR: '3',
              // Override browser opening commands to echo URL for detection
              BROWSER: os.platform() === 'win32' ? 'echo "OPEN_URL:"' : 'echo "OPEN_URL:"'
            }
          });

          console.log('🟢 Shell process started with PTY, PID:', shellProcess.pid);

          // Handle data output
          shellProcess.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
              let outputData = data;

              // Check for various URL opening patterns
              const patterns = [
                // Direct browser opening commands
                /(?:xdg-open|open|start)\s+(https?:\/\/[^\s\x1b\x07]+)/g,
                // BROWSER environment variable override
                /OPEN_URL:\s*(https?:\/\/[^\s\x1b\x07]+)/g,
                // Git and other tools opening URLs
                /Opening\s+(https?:\/\/[^\s\x1b\x07]+)/gi,
                // General URL patterns that might be opened
                /Visit:\s*(https?:\/\/[^\s\x1b\x07]+)/gi,
                /View at:\s*(https?:\/\/[^\s\x1b\x07]+)/gi,
                /Browse to:\s*(https?:\/\/[^\s\x1b\x07]+)/gi
              ];

              patterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(data)) !== null) {
                  const url = match[1];
                  console.log('🔗 Detected URL for opening:', url);

                  // Send URL opening message to client
                  ws.send(JSON.stringify({
                    type: 'url_open',
                    url: url
                  }));

                  // Replace the OPEN_URL pattern with a user-friendly message
                  if (pattern.source.includes('OPEN_URL')) {
                    outputData = outputData.replace(match[0], `🌐 Opening in browser: ${url}`);
                  }
                }
              });

              // Send regular output
              ws.send(JSON.stringify({
                type: 'output',
                data: outputData
              }));
            }
          });

          // Handle process exit
          shellProcess.onExit((exitCode) => {
            console.log('🔚 Shell process exited with code:', exitCode.exitCode, 'signal:', exitCode.signal);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'output',
                data: `\r\n\x1b[33mProcess exited with code ${exitCode.exitCode}${exitCode.signal ? ` (${exitCode.signal})` : ''}\x1b[0m\r\n`
              }));
            }
            shellProcess = null;
          });

        } catch (spawnError) {
          console.error('❌ Error spawning process:', spawnError);
          ws.send(JSON.stringify({
            type: 'output',
            data: `\r\n\x1b[31mError: ${spawnError.message}\x1b[0m\r\n`
          }));
        }

      } else if (data.type === 'input') {
        // Send input to shell process
        if (shellProcess && shellProcess.write) {
          try {
            shellProcess.write(data.data);
          } catch (error) {
            console.error('Error writing to shell:', error);
          }
        } else {
          console.warn('No active shell process to send input to');
        }
      } else if (data.type === 'resize') {
        // Handle terminal resize
        if (shellProcess && shellProcess.resize) {
          console.log('Terminal resize requested:', data.cols, 'x', data.rows);
          shellProcess.resize(data.cols, data.rows);
        }
      }
    } catch (error) {
      console.error('❌ Shell WebSocket error:', error.message);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: `\r\n\x1b[31mError: ${error.message}\x1b[0m\r\n`
        }));
      }
    }
  });

  ws.on('close', () => {
    console.log('🔌 Shell client disconnected');
    if (shellProcess && shellProcess.kill) {
      console.log('🔴 Killing shell process:', shellProcess.pid);
      shellProcess.kill();
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Shell WebSocket error:', error);
  });
}
