import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_PATH = join(__dirname, '../../database.db');

/**
 * Opens a connection to the SQLite database with FK enforcement enabled
 */
export async function getDb() {
  const db = await open({
    filename: DATABASE_PATH,
    driver: sqlite3.Database,
  });
  await db.exec('PRAGMA foreign_keys = ON');
  return db;
}

/**
 * Creates the users table if it doesn't exist
 */
async function createUsersTable(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
}

/**
 * Creates the tasks table if it doesn't exist
 */
async function createTasksTable(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

/**
 * Initializes the database: creates tables if they don't exist
 */
export async function initializeDatabase() {
  const db = await getDb();

  await createUsersTable(db);
  await createTasksTable(db);

  await db.close();
}
