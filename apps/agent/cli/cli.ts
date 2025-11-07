#!/usr/bin/env node
/**
 * CLI Framework
 * Defines the command structure and dispatches to command handlers
 */
import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { httpCommand } from "./commands/http.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
// __dirname will be dist/cli/ after build, so ../package.json points to dist/package.json
// But we want the source package.json, which is at ../../package.json from dist/cli/
const packageJson = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));

const program = new Command();

program
  .name("agent-cli")
  .description("Deepractice AI Agent CLI - Run the AI agent service")
  .version(packageJson.version);

// HTTP Server Command
program
  .command("http")
  .description("Start the HTTP server with WebSocket support")
  .option("--host <host>", "Host to bind to", "0.0.0.0")
  .option("--port <port>", "Port to listen on", "5200")
  .option("--project <path>", "Project directory path")
  .option("--anthropic-api-key <key>", "Anthropic API key")
  .option("--anthropic-base-url <url>", "Anthropic API base URL")
  .option("--node-env <env>", "Node environment (development/production)", "production")
  .action(httpCommand);

program.parse();
