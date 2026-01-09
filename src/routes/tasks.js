import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { getDb } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

export const tasksRouter = Router();

const VALID_STATUSES = ['pending', 'in-progress', 'completed'];

// Apply JWT authentication to all task routes.
// req.user will contain { userId, username } from the token payload.
tasksRouter.use(authenticateToken);

/**
 * GET /tasks
 * Retrieves all tasks for the authenticated user
 */
tasksRouter.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    // Only return tasks belonging to the authenticated user
    const tasks = await db.all(
      'SELECT * FROM tasks WHERE user_id = ?',
      req.user.userId
    );
    await db.close();

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /tasks/:id
 * Retrieves a specific task by ID (only if owned by user)
 */
tasksRouter.get('/:id', async (req, res, next) => {
  try {
    const db = await getDb();

    // Step 1: Check if task exists at all
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
    await db.close();

    if (!task) {
      // 404: Resource doesn't exist
      const err = new Error(`Task with ID ${req.params.id} not found`);
      err.status = 404;
      return next(err);
    }

    // Step 2: Check if user owns the task
    if (task.user_id !== req.user.userId) {
      // 403: Resource exists, but you're not allowed to access it
      const err = new Error('You do not have permission to access this task');
      err.status = 403;
      return next(err);
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /tasks
 * Creates a new task for the authenticated user
 */
tasksRouter.post('/', async (req, res, next) => {
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
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      );
      err.status = 400;
      return next(err);
    }

    const db = await getDb();
    const id = randomUUID();

    await db.run(
      'INSERT INTO tasks (id, title, description, status, user_id) VALUES (?, ?, ?, ?, ?)',
      [id, title, description || null, status, req.user.userId]
    );

    const newTask = await db.get('SELECT * FROM tasks WHERE id = ?', id);
    await db.close();

    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /tasks/:id
 * Partially updates an existing task (only if owned by user)
 */
tasksRouter.patch('/:id', async (req, res, next) => {
  try {
    const db = await getDb();

    // Step 1: Check if task exists at all
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
    if (!task) {
      await db.close();
      // 404: Resource doesn't exist
      const err = new Error(`Task with ID ${req.params.id} not found`);
      err.status = 404;
      return next(err);
    }

    // Step 2: Check if user owns the task
    if (task.user_id !== req.user.userId) {
      await db.close();
      // 403: Resource exists, but you're not allowed to modify it
      const err = new Error('You do not have permission to modify this task');
      err.status = 403;
      return next(err);
    }

    // Update with provided fields, keep existing values for missing fields
    const { title, description, status } = req.body;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      await db.close();
      const err = new Error(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      );
      err.status = 400;
      return next(err);
    }

    const updatedTitle = title ?? task.title;
    const updatedDescription = description ?? task.description;
    const updatedStatus = status ?? task.status;

    await db.run(
      'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
      [updatedTitle, updatedDescription, updatedStatus, req.params.id]
    );

    const updatedTask = await db.get(
      'SELECT * FROM tasks WHERE id = ?',
      req.params.id
    );
    await db.close();

    res.json(updatedTask);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /tasks/:id
 * Deletes a task (only if owned by user)
 */
tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const db = await getDb();

    // Step 1: Check if task exists at all
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
    if (!task) {
      await db.close();
      // 404: Resource doesn't exist
      const err = new Error(`Task with ID ${req.params.id} not found`);
      err.status = 404;
      return next(err);
    }

    // Step 2: Check if user owns the task
    if (task.user_id !== req.user.userId) {
      await db.close();
      // 403: Resource exists, but you're not allowed to delete it
      const err = new Error('You do not have permission to delete this task');
      err.status = 403;
      return next(err);
    }

    await db.run('DELETE FROM tasks WHERE id = ?', req.params.id);
    await db.close();

    res.json({ message: `Task ${req.params.id} deleted` });
  } catch (err) {
    next(err);
  }
});
