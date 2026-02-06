/**
 * Database Wrapper for Molt Wars
 *
 * Provides promisified wrappers around sqlite3 with proper error handling and logging.
 * Replaces raw db.run/db.get/db.each calls with async versions that log errors.
 */

import sqlite3 from "sqlite3";

// Database instance (initialized on first use)
let db = null;

/**
 * Initialize the database connection
 * @param {string} dbPath - Path to SQLite database file
 * @returns {sqlite3.Database}
 */
export function initDatabase(dbPath = "molt.db") {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("[DB Error] Failed to open database:", err.message);
        throw err;
      }
      console.log("[DB] Connected to", dbPath);
    });
  }
  return db;
}

/**
 * Get the raw database instance
 * @returns {sqlite3.Database}
 */
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Execute a SQL statement that modifies data (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL statement
 * @param {Array} params - Parameters for prepared statement
 * @returns {Promise<{lastID: number, changes: number}>}
 */
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(sql, params, function (err) {
      if (err) {
        console.error("[DB Error] dbRun:", sql.substring(0, 100), err.message);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * Execute a SQL query and return a single row
 * @param {string} sql - SQL query
 * @param {Array} params - Parameters for prepared statement
 * @returns {Promise<Object|undefined>}
 */
export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.get(sql, params, (err, row) => {
      if (err) {
        console.error("[DB Error] dbGet:", sql.substring(0, 100), err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Execute a SQL query and return all rows
 * @param {string} sql - SQL query
 * @param {Array} params - Parameters for prepared statement
 * @returns {Promise<Array>}
 */
export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.all(sql, params, (err, rows) => {
      if (err) {
        console.error("[DB Error] dbAll:", sql.substring(0, 100), err.message);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * Execute a SQL query and call callback for each row
 * @param {string} sql - SQL query
 * @param {Array} params - Parameters for prepared statement
 * @param {Function} rowCallback - Called for each row
 * @returns {Promise<number>} - Number of rows processed
 */
export function dbEach(sql, params, rowCallback) {
  return new Promise((resolve, reject) => {
    const database = getDb();
    let count = 0;
    database.each(
      sql,
      params,
      (err, row) => {
        if (err) {
          console.error("[DB Error] dbEach row:", err.message);
        } else {
          count++;
          rowCallback(row);
        }
      },
      (err, numRows) => {
        if (err) {
          console.error("[DB Error] dbEach complete:", sql.substring(0, 100), err.message);
          reject(err);
        } else {
          resolve(count);
        }
      }
    );
  });
}

/**
 * Execute multiple statements in a serialized transaction
 * @param {Function} fn - Async function containing database operations
 * @returns {Promise<*>}
 */
export async function dbTransaction(fn) {
  await dbRun("BEGIN TRANSACTION");
  try {
    const result = await fn();
    await dbRun("COMMIT");
    return result;
  } catch (err) {
    console.error("[DB Error] Transaction failed, rolling back:", err.message);
    await dbRun("ROLLBACK");
    throw err;
  }
}

/**
 * Initialize database tables
 */
export async function initTables() {
  const database = getDb();

  return new Promise((resolve, reject) => {
    database.serialize(() => {
      database.run(`CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        data TEXT
      )`);
      database.run(`CREATE TABLE IF NOT EXISTS planets (
        id TEXT PRIMARY KEY,
        data TEXT
      )`);
      database.run(`CREATE TABLE IF NOT EXISTS fleets (
        id TEXT PRIMARY KEY,
        data TEXT
      )`);
      database.run(`CREATE TABLE IF NOT EXISTS globals (
        key TEXT PRIMARY KEY,
        value INTEGER
      )`);
      database.run(`CREATE TABLE IF NOT EXISTS research_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet TEXT NOT NULL,
        author_name TEXT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        created_at INTEGER NOT NULL,
        upvotes INTEGER DEFAULT 0
      )`);
      database.run(`CREATE TABLE IF NOT EXISTS feature_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet TEXT NOT NULL,
        author_name TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at INTEGER NOT NULL,
        upvotes INTEGER DEFAULT 0
      )`);
      database.run(
        `CREATE TABLE IF NOT EXISTS codex_votes (
        wallet TEXT NOT NULL,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        PRIMARY KEY (wallet, item_type, item_id)
      )`
      );
      database.run(
        `CREATE TABLE IF NOT EXISTS debris_fields (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      )`
      );
      database.run(`CREATE TABLE IF NOT EXISTS score_history (
        agent_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        planet_count INTEGER NOT NULL,
        recorded_at INTEGER NOT NULL
      )`);
      database.run(`CREATE INDEX IF NOT EXISTS idx_score_history_agent ON score_history(agent_id, recorded_at)`);
      database.run(`CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        url TEXT NOT NULL,
        events TEXT NOT NULL,
        secret TEXT,
        created_at INTEGER NOT NULL,
        failures INTEGER DEFAULT 0
      )`);
      database.run(`CREATE INDEX IF NOT EXISTS idx_webhooks_agent ON webhooks(agent_id)`);
      database.run(`CREATE TABLE IF NOT EXISTS alliances (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        tag TEXT NOT NULL UNIQUE,
        leader_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`);
      database.run(`CREATE INDEX IF NOT EXISTS idx_alliances_leader ON alliances(leader_id)`,
        (err) => {
          if (err) {
            console.error("[DB Error] Failed to create tables:", err.message);
            reject(err);
          } else {
            console.log("[DB] Tables initialized");
            resolve();
          }
        }
      );
    });
  });
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error("[DB Error] Failed to close database:", err.message);
      } else {
        console.log("[DB] Connection closed");
      }
    });
    db = null;
  }
}
