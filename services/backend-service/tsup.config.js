import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { execSync } from 'child_process';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm'],
  target: 'node18',
  platform: 'node',
  bundle: true,

  // Don't bundle native modules (they need to be compiled per platform)
  external: [
    'better-sqlite3',
    'bcrypt',
    'node-pty',
    'sqlite3',
    'sharp'
  ],

  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,

  // Bundle everything else including claude-code
  noExternal: [],

  // Build-time: create database and bundle claude CLI
  async onSuccess() {
    const { cpSync, mkdirSync } = await import('fs');
    const distDir = 'dist';
    const dbPath = join(distDir, 'auth.db');
    const initSqlPath = join('migrations', 'init.sql');

    try {
      console.log('📦 Building production database...');

      // Read init.sql
      const initSQL = readFileSync(initSqlPath, 'utf8');

      // Create production database
      const db = new Database(dbPath);

      // Execute initialization SQL
      db.exec(initSQL);

      // Close database
      db.close();

      console.log('✅ Production database created at dist/auth.db');
    } catch (err) {
      console.error('⚠️  Failed to create production database:', err.message);
      throw err;
    }

    // Copy claude CLI to dist
    try {
      console.log('📦 Bundling Claude CLI...');

      // Find @anthropic-ai/claude-code in pnpm's .pnpm directory
      const monorepoRoot = join('..', '..');
      const claudePackagePath = join(
        monorepoRoot,
        'node_modules',
        '.pnpm',
        '@anthropic-ai+claude-code@2.0.30',
        'node_modules',
        '@anthropic-ai',
        'claude-code'
      );

      // Copy to dist/node_modules/@anthropic-ai/claude-code
      const distClaudePath = join(distDir, 'node_modules', '@anthropic-ai', 'claude-code');
      mkdirSync(join(distDir, 'node_modules', '@anthropic-ai'), { recursive: true });

      cpSync(claudePackagePath, distClaudePath, { recursive: true });

      console.log('✅ Claude CLI bundled to dist/node_modules/@anthropic-ai/claude-code');
    } catch (err) {
      console.error('⚠️  Failed to bundle Claude CLI:', err.message);
      // Non-fatal, continue build
    }
  }
});
