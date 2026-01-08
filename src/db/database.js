import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import bcrypt from 'bcrypt';

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

// Bcrypt cost factor: each increment doubles computation time.
// 10 rounds ≈ 100ms per hash — balances security vs. login speed.
// Higher = slower brute-force attacks, but also slower logins.
const SALT_ROUNDS = 10;

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
 * Seeds a default user if none exists
 * Returns the default user's ID
 */
async function seedDefaultUser(db) {
  // Test credentials for development only.
  // Real users register via /auth/register with their own passwords.
  const DEFAULT_USERNAME = 'default';
  const DEFAULT_PASSWORD = 'password123';

  let user = await db.get(
    'SELECT id FROM users WHERE username = ?',
    DEFAULT_USERNAME
  );

  if (!user) {
    const id = randomUUID();
    // bcrypt.hash() generates a random salt and embeds it in the output.
    // Result looks like: "$2b$10$salt22charshashedpassword..."
    // The salt prevents rainbow table attacks; bcrypt.compare() extracts it automatically.
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    await db.run(
      'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
      [id, DEFAULT_USERNAME, hashedPassword]
    );
    user = { id };
  }

  return user.id;
}

/**
 * Initializes the database: creates tables and seeds default user
 * Returns the default user ID
 */
export async function initializeDatabase() {
  const db = await getDb();

  await createUsersTable(db);
  await createTasksTable(db);
  const defaultUserId = await seedDefaultUser(db);

  await db.close();
  return defaultUserId;
}
