# Simple REST API

An educational project exploring REST API design with JWT authentication. Built with Node.js, Express, and SQLite.

## Tech Stack

- **Runtime**: Node.js with ESM modules (`type: "module"`)
- **Framework**: Express
- **Database**: SQLite via `sqlite3` (bindings) + `sqlite` (async/await wrapper)
- **Authentication**: JWT via `jsonwebtoken`, password hashing via `bcrypt`
- **Logging**: Morgan (HTTP request logger)
- **Environment**: dotenv for configuration
- **Code Quality**: ESLint + Prettier
- **Dev Tooling**: Nodemon (auto-restart on file changes)

## Project Structure

```
├── app.js                    # Entry point - starts server, initializes DB
├── src/
│   ├── express.js            # Express app setup, middleware, error handlers
│   ├── db/
│   │   └── database.js       # DB connection + table schema definitions
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   └── routes/
│       ├── auth.js           # Registration and login endpoints
│       └── tasks.js          # Task CRUD endpoints (protected)
├── scripts/
│   ├── seed-test-user.js     # Creates test user for development
│   ├── test-register.sh      # Tests registration endpoint
│   ├── test-login.sh         # Tests login endpoint
│   └── test-tasks.sh         # Tests tasks CRUD endpoints
└── database.db               # SQLite file (created on first run)
```

**Why this structure?**

- `src/` separates application code from config files and scripts at root level
- `routes/` groups endpoints by resource for convenient navigation
- `middleware/` isolates cross-cutting concerns (authentication)
- `scripts/` keeps one-off tooling separate from runtime code

## Quick Start

```bash
npm install          # Install dependencies
# Create .env file (see Environment Variables below)
npm run dev          # Start server with auto-reload
npm run seed         # Create test user
npm run test:api     # Run all endpoint tests (requires server running)
```

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Contents of `.env`:

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
```

- **JWT_SECRET** — Key used to sign and verify tokens.
- **JWT_EXPIRES_IN** — Token lifetime. Accepts `1h`, `7d`, `30m`, etc.

## Code Quality & Styling

This project separates concerns between ESLint and Prettier:

- **Prettier** handles all formatting (indentation, quotes, line length, semicolons)
- **ESLint** handles code quality only (unused vars, `===` enforcement, no `var`)

```bash
npm run lint          # Check for code quality issues
npm run lint:fix      # Auto-fix what ESLint can
npm run format        # Format all files with Prettier
npm run check         # Run both lint and format:check
```

## Database

### sqlite3 + sqlite

The project uses two packages:

- **sqlite3** — Connects Node.js to SQLite (native bindings)
- **sqlite** — Adds `async/await` support on top of sqlite3

```javascript
const db = await getDb();
const tasks = await db.all('SELECT * FROM tasks WHERE user_id = ?', userId);
await db.close();
```

### Schema

> Paste this into [dbdiagram.io](https://dbdiagram.io) to generate a visual schema diagram.

```dbml
Table users {
  id text [pk, note: 'UUID']
  username text [unique, not null]
  password text [not null, note: 'bcrypt hash']
}

Table tasks {
  id text [pk, note: 'UUID']
  title text [not null]
  description text
  status text [not null, note: 'pending | in-progress | completed']
  user_id text [not null, ref: > users.id]
}
```

**Field notes:**

- `id` — UUID generated with `crypto.randomUUID()`
- `password` — bcrypt hash (never stored in plain text)
- `user_id` — Foreign key linking task to its owner

### Foreign Key Enforcement

SQLite doesn't enforce foreign keys by default. The `getDb()` function enables it:

```javascript
await db.exec('PRAGMA foreign_keys = ON');
```

This prevents creating tasks with non-existent `user_id` values.

## Authentication

### How JWT Authentication Works

1. **Registration** (`POST /auth/register`) — Creates user with bcrypt-hashed password
2. **Login** (`POST /auth/login`) — Verifies credentials, returns signed JWT
3. **Protected requests** — Client sends `Authorization: Bearer <token>` header
4. **Middleware verification** — `authenticateToken` validates signature and expiration
5. **Route access** — Decoded payload (`{userId, username}`) attached to `req.user`

### Token Structure

JWTs have three parts separated by dots: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.    # Header (algorithm)
eyJ1c2VySWQiOiJhYmMtMTIzIiwidXNlcm5hbWUi...  # Payload (data)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV...     # Signature (verification)
```

The signature is created using `JWT_SECRET`. If anyone tampers with the payload, the signature won't match and `jwt.verify()` will reject the token.

## Endpoints

### Route Structure

Each route file exports a `Router` instance. Routes are mounted in `src/express.js`:

```javascript
app.use('/auth', authRouter);
app.use('/tasks', tasksRouter);
```

The tasks router applies authentication middleware to all its routes:

```javascript
tasksRouter.use(authenticateToken);
```

### Authentication Routes

**POST /auth/register** — Create a new user

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "myuser", "password": "mypass"}'
```

Returns: `{"id": "uuid", "username": "myuser"}` (201)

**POST /auth/login** — Get JWT token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

Returns: `{"token": "eyJhbG..."}` (200)

### Task Routes (requires JWT)

All task endpoints require the `Authorization: Bearer <token>` header.

**GET /tasks** — List all tasks for current user

```bash
curl http://localhost:3000/tasks \
  -H "Authorization: Bearer <token>"
```

**GET /tasks/:id** — Get a specific task (404 if not found, 403 if not owner)

```bash
curl http://localhost:3000/tasks/<id> \
  -H "Authorization: Bearer <token>"
```

**POST /tasks** — Create a task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title": "My task", "description": "Optional", "status": "pending"}'
```

Required: `title`, `status`. Optional: `description`.
Valid statuses: `pending`, `in-progress`, `completed`

**PATCH /tasks/:id** — Partial update (only send fields to change)

```bash
curl -X PATCH http://localhost:3000/tasks/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"status": "completed"}'
```

**DELETE /tasks/:id** — Delete a task

```bash
curl -X DELETE http://localhost:3000/tasks/<id> \
  -H "Authorization: Bearer <token>"
```

## Error Handling

The app uses a layered error handling approach:

### 1. Route-Level Try/Catch

Each route handler wraps async operations in try/catch and forwards errors via `next(err)`:

```javascript
tasksRouter.get('/', async (req, res, next) => {
  try {
    const db = await getDb();
    // ... implementation
  } catch (err) {
    next(err);
  }
});
```

### 2. Resource Validation

Routes check if resources exist and if the user has permission:

```javascript
if (!task) {
  const err = new Error('Task not found');
  err.status = 404;
  return next(err);
}

if (task.user_id !== req.user.userId) {
  const err = new Error('You do not have permission');
  err.status = 403;
  return next(err);
}
```

### 3. Global Error Handler

All errors flow through the global handler in `src/express.js`:

```javascript
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});
```

**Why this approach?**

- **Centralized logging** — All errors flow through one place
- **Consistent response format** — Clients always get `{ error: "message" }`
- **Proper HTTP status codes** — 400 (bad input), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)

## Test Scripts

Test scripts verify endpoints work correctly. Requires `curl` and `jq`.

```bash
npm run test:register   # Test user registration
npm run test:login      # Test login (requires seeded user)
npm run test:tasks      # Test CRUD operations (requires seeded user)
npm run test:api        # Run all tests sequentially
```

The scripts test both success cases and error cases (missing fields, invalid tokens, etc.).

## NPM Scripts Reference

- `npm start` — Start production server
- `npm run dev` — Start with auto-reload (nodemon)
- `npm run seed` — Create test user (`testuser` / `password123`)
- `npm run test:api` — Run all endpoint tests
- `npm run lint` — Check code quality
- `npm run format` — Format with Prettier
- `npm run check` — Run lint + format check
