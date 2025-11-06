import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,

  // External dependencies - these will be required at runtime
  external: [
    'express',
    'ws',
    'cors',
    'dotenv',
    'multer',
    'bcrypt',
    'jsonwebtoken',
    'node-pty',
    'chokidar',
    'sqlite3',
    'sqlite',
    'gray-matter',
    'mime-types',
    'node-fetch',
    '@anthropic-ai/claude-agent-sdk',
    '@deepracticex/logger',
    '@deepractice-ai/agent-sdk',
  ],

  // Bundle workspace packages (only config, sdk will be external)
  noExternal: [
    '@deepractice-ai/agent-config',
  ],

  // Keep the original module format (ESM)
  splitting: false,
  sourcemap: true,

  // Don't minify for better debugging
  minify: false,

  // Copy static files if needed
  publicDir: false,
});
