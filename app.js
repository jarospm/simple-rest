import { app } from './src/express.js';

const port = process.env.PORT || 3000;

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
