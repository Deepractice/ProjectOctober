import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['server/index.ts'],
  format: ['esm'],
  dts: false, // Disable DTS generation for now (JS files need TS conversion)
  sourcemap: true,
  clean: true,
  outDir: 'dist/server',
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
