export default {
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
  external: ["@anthropic-ai/claude-agent-sdk", "@anthropic-ai/sdk", "rxjs"],
};
