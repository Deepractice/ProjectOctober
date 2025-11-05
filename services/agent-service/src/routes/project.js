/**
 * Project and File API Routes
 * Handles project info, file operations, and file tree
 */

import express from "express";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import mime from "mime-types";
import { config } from "../index.js";

const router = express.Router();

function getProjectInfo() {
  const projectPath = config().projectPath;
  if (!projectPath) {
    throw new Error("PROJECT_PATH not configured");
  }
  const fullPath = path.resolve(projectPath);
  return {
    name: path.basename(fullPath),
    path: projectPath,
    fullPath: fullPath,
  };
}

// Get current project information
router.get("/", (req, res) => {
  try {
    const project = getProjectInfo();
    res.json({
      name: project.name,
      path: project.path,
      fullPath: project.fullPath,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read file content endpoint
router.get("/file", async (req, res) => {
  try {
    const { filePath } = req.query;

    console.log("📄 File read request:", filePath);

    // Security: ensure the requested path is inside the project root
    if (!filePath) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    const project = getProjectInfo();
    const projectRoot = project.fullPath;

    // Handle both absolute and relative paths
    const resolved = path.isAbsolute(filePath)
      ? path.resolve(filePath)
      : path.resolve(projectRoot, filePath);
    const normalizedRoot = path.resolve(projectRoot) + path.sep;
    if (!resolved.startsWith(normalizedRoot)) {
      return res.status(403).json({ error: "Path must be under project root" });
    }

    const content = await fsPromises.readFile(resolved, "utf8");
    res.json({ content, path: resolved });
  } catch (error) {
    console.error("Error reading file:", error);
    if (error.code === "ENOENT") {
      res.status(404).json({ error: "File not found" });
    } else if (error.code === "EACCES") {
      res.status(403).json({ error: "Permission denied" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Serve binary file content endpoint (for images, etc.)
router.get("/files/content", async (req, res) => {
  try {
    const { path: filePath } = req.query;

    console.log("🖼️ Binary file serve request:", filePath);

    // Security: ensure the requested path is inside the project root
    if (!filePath) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    const project = getProjectInfo();
    const projectRoot = project.fullPath;

    const resolved = path.resolve(filePath);
    const normalizedRoot = path.resolve(projectRoot) + path.sep;
    if (!resolved.startsWith(normalizedRoot)) {
      return res.status(403).json({ error: "Path must be under project root" });
    }

    // Check if file exists
    try {
      await fsPromises.access(resolved);
    } catch (error) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get file extension and set appropriate content type
    const mimeType = mime.lookup(resolved) || "application/octet-stream";
    res.setHeader("Content-Type", mimeType);

    // Stream the file
    const fileStream = fs.createReadStream(resolved);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error reading file" });
      }
    });
  } catch (error) {
    console.error("Error serving binary file:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Save file content endpoint
router.put("/file", async (req, res) => {
  try {
    const { filePath, content } = req.body;

    console.log("💾 File save request:", filePath);

    // Security: ensure the requested path is inside the project root
    if (!filePath) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    if (content === undefined) {
      return res.status(400).json({ error: "Content is required" });
    }

    const project = getProjectInfo();
    const projectRoot = project.fullPath;

    // Handle both absolute and relative paths
    const resolved = path.isAbsolute(filePath)
      ? path.resolve(filePath)
      : path.resolve(projectRoot, filePath);
    const normalizedRoot = path.resolve(projectRoot) + path.sep;
    if (!resolved.startsWith(normalizedRoot)) {
      return res.status(403).json({ error: "Path must be under project root" });
    }

    // Write the new content
    await fsPromises.writeFile(resolved, content, "utf8");

    res.json({
      success: true,
      path: resolved,
      message: "File saved successfully",
    });
  } catch (error) {
    console.error("Error saving file:", error);
    if (error.code === "ENOENT") {
      res.status(404).json({ error: "File or directory not found" });
    } else if (error.code === "EACCES") {
      res.status(403).json({ error: "Permission denied" });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get file tree for project
router.get("/files", async (req, res) => {
  try {
    const project = getProjectInfo();
    const actualPath = project.fullPath;

    // Check if path exists
    try {
      await fsPromises.access(actualPath);
    } catch (e) {
      return res.status(404).json({ error: `Project path not found: ${actualPath}` });
    }

    const files = await getFileTree(actualPath, 10, 0, true);
    res.json(files);
  } catch (error) {
    console.error("❌ File tree error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to convert permissions to rwx format
function permToRwx(perm) {
  const r = perm & 4 ? "r" : "-";
  const w = perm & 2 ? "w" : "-";
  const x = perm & 1 ? "x" : "-";
  return r + w + x;
}

// Helper function to get file tree
async function getFileTree(dirPath, maxDepth = 3, currentDepth = 0, showHidden = true) {
  const items = [];

  try {
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip heavy build directories
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "build")
        continue;

      const itemPath = path.join(dirPath, entry.name);
      const item = {
        name: entry.name,
        path: itemPath,
        type: entry.isDirectory() ? "directory" : "file",
      };

      // Get file stats for additional metadata
      try {
        const stats = await fsPromises.stat(itemPath);
        item.size = stats.size;
        item.modified = stats.mtime.toISOString();

        // Convert permissions to rwx format
        const mode = stats.mode;
        const ownerPerm = (mode >> 6) & 7;
        const groupPerm = (mode >> 3) & 7;
        const otherPerm = mode & 7;
        item.permissions =
          ((mode >> 6) & 7).toString() + ((mode >> 3) & 7).toString() + (mode & 7).toString();
        item.permissionsRwx = permToRwx(ownerPerm) + permToRwx(groupPerm) + permToRwx(otherPerm);
      } catch (statError) {
        // If stat fails, provide default values
        item.size = 0;
        item.modified = null;
        item.permissions = "000";
        item.permissionsRwx = "---------";
      }

      if (entry.isDirectory() && currentDepth < maxDepth) {
        // Recursively get subdirectories but limit depth
        try {
          // Check if we can access the directory before trying to read it
          await fsPromises.access(item.path, fs.constants.R_OK);
          item.children = await getFileTree(item.path, maxDepth, currentDepth + 1, showHidden);
        } catch (e) {
          // Silently skip directories we can't access
          item.children = [];
        }
      }

      items.push(item);
    }
  } catch (error) {
    // Only log non-permission errors
    if (error.code !== "EACCES" && error.code !== "EPERM") {
      console.error("Error reading directory:", error);
    }
  }

  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export default router;
