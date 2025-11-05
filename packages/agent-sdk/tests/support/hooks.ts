import { Before, After, BeforeAll } from "@deepracticex/vitest-cucumber";
import { getConfig } from "@deepractice-ai/agent-config";
import { mkdirSync, existsSync } from "fs";
import { resolve } from "path";

BeforeAll(async function () {
  // Load config from root .env
  const config = await getConfig({
    envPath: "../../.env", // Monorepo root
  });

  // Resolve project path from config (default is '.')
  const projectPath = resolve(config.projectPath || ".");

  // Ensure project path exists (fix for spawn ENOENT when cwd doesn't exist)
  if (!existsSync(projectPath)) {
    mkdirSync(projectPath, { recursive: true });
  }

  // Store in global for world.ts to use
  (global as any).__TEST_WORKSPACE__ = projectPath;

  if (!config.anthropicApiKey) {
    console.warn("⚠️  ANTHROPIC_API_KEY not found. Tests will be skipped.");
    console.warn("   Set ANTHROPIC_API_KEY in .env to run real tests.");
    // Don't throw, just warn - allows skeleton testing
  } else {
    console.log("✅ Test environment ready with API key");
    console.log(`📁 Test workspace: ${projectPath}`);
  }
});

Before(async function () {
  // Clean state before each scenario
  await this.cleanup();
});

After(async function () {
  // Cleanup after each scenario
  await this.cleanup();
});
