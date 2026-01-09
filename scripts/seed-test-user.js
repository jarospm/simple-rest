#!/usr/bin/env node

/**
 * Creates a test user for development/testing purposes.
 * Run with: node scripts/seed-test-user.js
 */

import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { getDb } from '../src/db/database.js';

const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'password123';
const SALT_ROUNDS = 10;

async function seedTestUser() {
  const db = await getDb();

  // Check if user already exists
  const existing = await db.get(
    'SELECT id FROM users WHERE username = ?',
    TEST_USERNAME
  );

  if (existing) {
    console.log(`User '${TEST_USERNAME}' already exists (ID: ${existing.id})`);
    await db.close();
    return;
  }

  // Create test user
  const id = randomUUID();
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

  await db.run('INSERT INTO users (id, username, password) VALUES (?, ?, ?)', [
    id,
    TEST_USERNAME,
    hashedPassword,
  ]);

  await db.close();

  console.log('Test user created:');
  console.log(`  Username: ${TEST_USERNAME}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log(`  ID: ${id}`);
}

seedTestUser().catch(console.error);
