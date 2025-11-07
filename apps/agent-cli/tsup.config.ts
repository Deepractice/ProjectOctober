import { defineConfig } from "tsup";
import { cpSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

export default defineConfig({
  entry: ["src/bin/agent-cli.ts", "src/commands/http.ts", "src/cli.ts"],
  format: ["esm"],
  outDir: "dist",
  dts: true,
  clean: true,
  sourcemap: true,

  // Copy runtime resources after build
  async onSuccess() {
    const distDir = "./dist";
    const runtimeDir = join(distDir, "runtime");

    console.log("📦 Copying runtime resources from apps/agent...");

    // Create runtime directory
    if (!existsSync(runtimeDir)) {
      mkdirSync(runtimeDir, { recursive: true });
    }

    // Copy agent server bundle
    const agentServerSrc = "../agent/dist/server/index.js";
    const agentServerDest = join(runtimeDir, "agent.js");

    if (existsSync(agentServerSrc)) {
      cpSync(agentServerSrc, agentServerDest);
      console.log("✅ Copied agent server bundle");
    } else {
      console.error(
        "❌ apps/agent/dist/server/index.js not found. Run `pnpm build` in apps/agent first."
      );
      process.exit(1);
    }

    // Copy agent web dist directory
    const agentWebSrc = "../agent/dist/web";
    const agentWebDest = join(runtimeDir, "web");

    if (existsSync(agentWebSrc)) {
      cpSync(agentWebSrc, agentWebDest, { recursive: true });
      console.log("✅ Copied agent web dist");
    } else {
      console.error("❌ apps/agent/dist/web not found. Run `pnpm build` in apps/agent first.");
      process.exit(1);
    }

    console.log("🎉 Runtime resources copied successfully!");
    console.log(`📂 Structure:\n   dist/runtime/agent.js\n   dist/runtime/web/`);
  },
});
