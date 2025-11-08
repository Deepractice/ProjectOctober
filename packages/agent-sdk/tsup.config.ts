export default {
  entry: {
    index: "src/index.ts",
    browser: "src/api/browser.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  external: ["@anthropic-ai/claude-agent-sdk", "@anthropic-ai/sdk", "rxjs"],
};
