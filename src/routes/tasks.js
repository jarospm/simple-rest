import { Router } from 'express';
import { getDb } from '../db/database.js';

export const tasksRouter = Router();

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
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
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
