export default {
  entry: {
    "api/common/index": "src/api/common/index.ts",
    "api/server/index": "src/api/server/index.ts",
    "api/browser/index": "src/api/browser/index.ts",
  },
  format: ["esm"],
  dts: false, // Temporarily disabled due to type issues in BrowserAgent
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  external: ["@anthropic-ai/claude-agent-sdk", "@anthropic-ai/sdk", "rxjs", "ws", "better-sqlite3"],
};
