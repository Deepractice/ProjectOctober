import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'server/index': 'server/index.ts',
    'cli/bin': 'cli/bin.ts',
    'cli/cli': 'cli/cli.ts',
    'cli/commands/http': 'cli/commands/http.ts',
  },
  format: ['esm'],
  dts: false, // Disable DTS generation for now (JS files need TS conversion)
  sourcemap: true,
  clean: false, // Don't clean dist to preserve vite build output
  outDir: 'dist',
  external: [
    'express',
    'ws',
    'node-pty',
    '@anthropic-ai/claude-agent-sdk'
  ],
  noExternal: [
    '@deepractice-ai/agent-config',
    '@deepractice-ai/agent-sdk'
  ]
})
