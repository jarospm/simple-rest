import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getDb } from '../db/database.js';
import { defaultUserId } from '../../app.js';

export const tasksRouter = Router();

/**
 * Mock auth middleware - attaches default user to req
 * TODO: replace with real JWT middleware
 */
const mockAuth = (req, _res, next) => {
  req.user = { id: defaultUserId };
  next();
};

/**
 * GET /tasks
 * Retrieves all tasks
 */
tasksRouter.get('/', async (_req, res, next) => {
  try {
    const db = await getDb();
    const tasks = await db.all('SELECT * FROM tasks');
    await db.close();

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /tasks/:id
 * Retrieves a specific task by ID
 */
tasksRouter.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();
    const task = await db.get(
      'SELECT * FROM tasks WHERE id = ?',
      req.params.id
    );
    await db.close();

    if (!task) {
      const err = new Error(`Task with ID ${req.params.id} not found`);
      err.status = 404;
      return next(err);
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /tasks
 * Creates a new task
 */
tasksRouter.post('/', mockAuth, async (req, res, next) => {
  try {
    const { title, description, status } = req.body;

    // Validate required fields
    if (!title) {
      const err = new Error('Title is required');
      err.status = 400;
      return next(err);
    }
    if (!status) {
      const err = new Error('Status is required');
      err.status = 400;
      return next(err);
    }

    const db = await getDb();
    const id = randomUUID();

    await db.run(
      'INSERT INTO tasks (id, title, description, status, user_id) VALUES (?, ?, ?, ?, ?)',
      [id, title, description || null, status, req.user.id]
    );

    const newTask = await db.get('SELECT * FROM tasks WHERE id = ?', id);
    await db.close();

    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});
