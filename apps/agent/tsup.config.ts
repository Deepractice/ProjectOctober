import { defineConfig } from "tsup";
import { copyFileSync } from "fs";
import { join } from "path";

export default defineConfig({
  entry: {
    "server/index": "server/index.ts",
    "cli/bin": "cli/bin.ts",
    "cli/cli": "cli/cli.ts",
    "cli/commands/http": "cli/commands/http.ts",
  },
  format: ["esm"],
  dts: false, // Disable DTS generation for now (JS files need TS conversion)
  sourcemap: true,
  clean: false, // Don't clean dist to preserve vite build output
  outDir: "dist",
  external: ["express", "ws", "node-pty", "@deepractice-ai/agent-sdk"],
  onSuccess: async () => {
    // Copy package.json to dist for CLI version reading
    copyFileSync(join(process.cwd(), "package.json"), join(process.cwd(), "dist", "package.json"));
  },
});
