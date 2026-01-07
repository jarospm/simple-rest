import express from 'express';
import morgan from 'morgan';

// Create Express App
const app = express();

// Disable 'X-Powered-By Express' response header
app.disable('x-powered-by');

// Log requests
app.use(morgan('dev'));

// Parse JSON request bodies
// Without it, req.body stays undefined
app.use(express.json());

// API routes
// app.use('/api/...', router);

// Root status check route
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler (for unmatched routes) — delegates to global error handler
app.use((_req, _res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Global error handler (must have 4 parameters)
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  console.error(err.stack);

  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

export { app };
