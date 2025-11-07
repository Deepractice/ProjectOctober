#!/usr/bin/env node
/**
 * CLI Entry Point
 * This is the executable that users run when they type `agentx`
 *
 * Force production mode when running from CLI
 */

// Force production mode - CLI should ALWAYS run in production
// This prevents environment pollution from development settings
// Use dynamic import to ensure this runs BEFORE any module code
process.env.NODE_ENV = "production";

await import("./cli.js");
