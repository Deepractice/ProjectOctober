/**
 * Project Path Mapper
 *
 * Maps placeholder project names (like '-project') to actual file system paths.
 * This allows the frontend to use a simple placeholder while the backend
 * handles the actual project directory configuration.
 */

import path from 'path';
import crypto from 'crypto';

/**
 * Map a project name to its actual file system path
 * @param {string} projectName - The project name from the frontend (e.g., '-project')
 * @returns {string} - The actual project path
 */
export function mapProjectName(projectName) {
  // Handle the '-project' placeholder
  if (projectName === '-project') {
    const configuredPath = process.env.PROJECT_PATH;

    if (!configuredPath) {
      throw new Error(
        'PROJECT_PATH not configured. Please set PROJECT_PATH in your .env file.'
      );
    }

    return configuredPath;
  }

  // For other project names, decode them from the Claude naming convention
  // Claude encodes paths by replacing / with -
  return projectName.replace(/-/g, '/');
}

/**
 * Map a project path back to its encoded name
 * This is the reverse of mapProjectName for non-placeholder projects
 * @param {string} projectPath - The actual file system path
 * @returns {string} - The encoded project name
 */
export function encodeProjectPath(projectPath) {
  // Check if this matches the configured PROJECT_PATH
  if (process.env.PROJECT_PATH && projectPath === process.env.PROJECT_PATH) {
    return '-project';
  }

  // Otherwise use Claude's encoding convention
  return projectPath.replace(/\//g, '-');
}

/**
 * Get the Claude project directory name for a given path
 * This is used to locate the .claude/projects/{name} directory
 * @param {string} projectPath - The actual file system path
 * @returns {string} - The directory name in ~/.claude/projects/
 */
export function getClaudeProjectDirName(projectPath) {
  // For the configured PROJECT_PATH, we need to find the actual Claude directory name
  // which is the path with / replaced by -
  return projectPath.replace(/\//g, '-');
}

/**
 * Get MD5 hash for Cursor project identification
 * @param {string} projectPath - The actual file system path
 * @returns {string} - MD5 hash used by Cursor
 */
export function getCursorProjectHash(projectPath) {
  return crypto.createHash('md5').update(projectPath).digest('hex');
}
