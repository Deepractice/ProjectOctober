import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine environment and set paths accordingly
const isDev = __dirname.includes('/src');

let DB_PATH, INIT_SQL_PATH;

if (isDev) {
  // Development: use migrations/ directory
  const projectRoot = path.resolve(__dirname, '..');
  DB_PATH = path.join(projectRoot, 'migrations', 'auth.db');
  INIT_SQL_PATH = path.join(projectRoot, 'migrations', 'init.sql');
} else {
  // Production: database is in dist/ (created at build time)
  DB_PATH = path.join(__dirname, 'auth.db');
  INIT_SQL_PATH = null; // Not needed in production
}

// Create database connection
const db = new Database(DB_PATH);
console.log('Connected to SQLite database');

// Initialize database with schema
const initializeDatabase = async () => {
  try {
    if (isDev && INIT_SQL_PATH) {
      // Development: initialize from init.sql
      const initSQL = fs.readFileSync(INIT_SQL_PATH, 'utf8');
      db.exec(initSQL);
      console.log('Database initialized successfully (dev mode)');
    } else {
      // Production: database already initialized at build time
      console.log('Database already initialized (production mode)');
    }
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
};

// User database operations
const userDb = {
  // Check if any users exist
  hasUsers: () => {
    try {
      const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
      return row.count > 0;
    } catch (err) {
      throw err;
    }
  },

  // Create a new user
  createUser: (username, passwordHash) => {
    try {
      const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
      const result = stmt.run(username, passwordHash);
      return { id: result.lastInsertRowid, username };
    } catch (err) {
      throw err;
    }
  },

  // Get user by username
  getUserByUsername: (username) => {
    try {
      const row = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
      return row;
    } catch (err) {
      throw err;
    }
  },

  // Update last login time
  updateLastLogin: (userId) => {
    try {
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    } catch (err) {
      throw err;
    }
  },

  // Get user by ID
  getUserById: (userId) => {
    try {
      const row = db.prepare('SELECT id, username, created_at, last_login FROM users WHERE id = ? AND is_active = 1').get(userId);
      return row;
    } catch (err) {
      throw err;
    }
  }
};

export {
  db,
  initializeDatabase,
  userDb
};