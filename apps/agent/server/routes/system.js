/**
 * System API Routes
 * Handles system configuration and updates
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('express').Router} */
const router = express.Router();

// Get server configuration
router.get("/config", (req, res) => {
  const host = req.headers.host || `${req.hostname}:${process.env.PORT || 3001}`;
  const protocol =
    req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "wss" : "ws";

  console.log("Config API called - Returning host:", host, "Protocol:", protocol);

  res.json({
    serverPort: process.env.PORT || 3001,
    wsUrl: `${protocol}://${host}`,
  });
});

// System update endpoint
router.post("/update", async (req, res) => {
  try {
    // Get the project root directory (parent of server directory)
    const projectRoot = path.join(__dirname, "../..");

    console.log("Starting system update from directory:", projectRoot);

    // Run the update command
    const updateCommand = "git checkout main && git pull && npm install";

    const child = spawn("sh", ["-c", updateCommand], {
      cwd: projectRoot,
      env: process.env,
    });

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;
      console.log("Update output:", text);
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error("Update error:", text);
    });

    child.on("close", (code) => {
      if (code === 0) {
        res.json({
          success: true,
          output: output || "Update completed successfully",
          message: "Update completed. Please restart the server to apply changes.",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Update command failed",
          output: output,
          errorOutput: errorOutput,
        });
      }
    });

    child.on("error", (error) => {
      console.error("Update process error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    });
  } catch (error) {
    console.error("System update error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
