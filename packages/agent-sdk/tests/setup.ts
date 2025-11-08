/**
 * Vitest Setup File
 * Loaded before all tests
 */

import { config } from "dotenv";
import path from "path";
import fs from "fs";

// Load environment files from tests/ directory
// 1. tests/.env - default test configuration (committed)
// 2. tests/.env.secret - secret keys (gitignored, optional)

const testsDir = __dirname;

// Load tests/.env (default test config)
const envPath = path.join(testsDir, ".env");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
  console.log("✓ Loaded tests/.env");
}

// Load tests/.env.secret (secrets - optional)
const envSecretPath = path.join(testsDir, ".env.secret");
if (fs.existsSync(envSecretPath)) {
  config({ path: envSecretPath, override: true });
  console.log("✓ Loaded tests/.env.secret");
}

console.log("\nTest environment:");
console.log("  TEST_WORKSPACE:", process.env.TEST_WORKSPACE);
console.log(
  "  AGENT_API_KEY:",
  process.env.AGENT_API_KEY ? "***" + process.env.AGENT_API_KEY.slice(-4) : "not set"
);
console.log("  AGENT_BASE_URL:", process.env.AGENT_BASE_URL);
console.log("");
