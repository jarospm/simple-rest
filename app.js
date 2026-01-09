import 'dotenv/config';

import { app } from './src/express.js';
import { initializeDatabase } from './src/db/database.js';

const port = process.env.PORT || 3000;

// Initialize database and get default user ID
export const defaultUserId = await initializeDatabase();
console.log(`Database initialized. Default user ID: ${defaultUserId}`);

const server = app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

server.on('error', (err) => {
  console.error(`Server error: ${err}`);
});

function shutdown() {
  console.log('Shutting down...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
