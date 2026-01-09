import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database.js';

export const authRouter = Router();

// JWT_SECRET is a cryptographic key used to sign tokens.
// - On login: jwt.sign() uses it to create a tamper-proof signature
// - On protected routes: jwt.verify() uses it to validate the signature
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// Bcrypt cost factor
const SALT_ROUNDS = 10;

/**
 * POST /auth/register
 * Creates a new user with hashed password
 */
authRouter.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username) {
      const err = new Error('Username is required');
      err.status = 400;
      return next(err);
    }
    if (!password) {
      const err = new Error('Password is required');
      err.status = 400;
      return next(err);
    }

    const db = await getDb();

    // Check if username already exists
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ?',
      username
    );
    if (existingUser) {
      await db.close();
      const err = new Error('Username already exists');
      err.status = 400;
      return next(err);
    }

    // Hash password and create user
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await db.run(
      'INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
      [id, username, hashedPassword]
    );

    // Return user without password
    const newUser = await db.get(
      'SELECT id, username FROM users WHERE id = ?',
      id
    );
    await db.close();

    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 * Authenticates user and returns JWT token
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      const err = new Error('Username and password are required');
      err.status = 400;
      return next(err);
    }

    const db = await getDb();

    // Find user by username
    const user = await db.get(
      'SELECT id, username, password FROM users WHERE username = ?',
      username
    );
    await db.close();

    if (!user) {
      const err = new Error('User not found');
      err.status = 401;
      return next(err);
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const err = new Error('Wrong password');
      err.status = 401;
      return next(err);
    }

    // Generate JWT: a signed token the client will send with future requests.
    // Structure: header.payload.signature (base64-encoded, dot-separated)
    //
    // jwt.sign(payload, secret, options) creates the token:
    // - payload: data embedded in token (extracted later via jwt.verify)
    // - secret: key for HMAC signature (proves token wasn't tampered with)
    // - expiresIn: adds 'exp' claim; jwt.verify() rejects expired tokens
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Client stores this token and sends it in future requests as:
    // Authorization: Bearer <token>
    res.json({ token });
  } catch (err) {
    next(err);
  }
});
