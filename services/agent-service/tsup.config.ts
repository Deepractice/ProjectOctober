import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.js"],
  format: ["esm"],
  outDir: "dist",
  clean: true,

  // External dependencies - these will be required at runtime
  external: [
    "express",
    "ws",
    "cors",
    "dotenv",
    "multer",
    "jsonwebtoken",
    "node-pty",
    "chokidar",
    "gray-matter",
    "mime-types",
    "node-fetch",
    "@anthropic-ai/claude-agent-sdk",
  ],

  // Bundle workspace packages only (config and sdk)
  // Logger has native/dynamic dependencies (pino), keep it external
  noExternal: [
    "@deepractice-ai/agent-config",
    "@deepractice-ai/agent-sdk",
  ],

  // Keep the original module format (ESM)
  splitting: false,
  sourcemap: true,

  // Don't minify for better debugging
  minify: false,

  // Copy static files if needed
  publicDir: false,
});
