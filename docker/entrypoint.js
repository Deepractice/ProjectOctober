#!/usr/bin/env node

/**
 * Claude Code UI - Docker Entrypoint
 * Handles container initialization and starts the server
 */

const { spawn, execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

const PORT = process.env.PORT || 3001;
const PROJECT_DIR = '/project';

console.log('🔧 Initializing Claude Code UI environment...\n');

/**
 * Execute shell command with sudo
 */
function execSudo(command) {
  try {
    execSync(`sudo ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Setup permissions for Claude config and app directories
 */
function setupPermissions() {
  console.log('📁 Setting up permissions...');

  // Claude config directory
  execSudo('chmod -R 777 /opt/claude-config');
  execSudo('chown -R node:node /app');

  console.log('✓ Base permissions configured\n');
}

/**
 * Setup project directory if mounted
 */
function setupProjectDirectory() {
  if (existsSync(PROJECT_DIR)) {
    console.log('📂 Project directory detected, configuring permissions...');
    execSudo(`chown -R node:node ${PROJECT_DIR}`);
    console.log(`✓ ${PROJECT_DIR} permissions configured\n`);
  } else {
    console.log('⚠️  No project directory mounted at /project\n');
  }
}

/**
 * Start the Claude Code UI server
 */
function startServer() {
  console.log(`✅ Starting Claude Code UI server on port ${PORT}...\n`);
  console.log('─'.repeat(60));

  const serverPath = join(process.cwd(), 'server', 'index.js');

  if (!existsSync(serverPath)) {
    console.error(`❌ Server file not found: ${serverPath}`);
    process.exit(1);
  }

  // Start the server process
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`\n⚠️  Server exited with code ${code}`);
    process.exit(code);
  });

  // Handle shutdown signals
  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
      console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
      server.kill(signal);
    });
  });
}

/**
 * Main entrypoint
 */
async function main() {
  try {
    setupPermissions();
    setupProjectDirectory();
    startServer();
  } catch (error) {
    console.error('❌ Entrypoint error:', error);
    process.exit(1);
  }
}

main();
