import jwt from 'jsonwebtoken';

// Must match the secret used in routes/auth.js for signing tokens.
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authentication middleware: verifies JWT from Authorization header.
 *
 * Expected header format: "Authorization: Bearer <token>"
 *
 * On success: attaches decoded payload to req.user and calls next()
 * On failure: returns 401 with error message
 */
export function authenticateToken(req, res, next) {
  // Extract the Authorization header value.
  // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const authHeader = req.headers.authorization;

  // Split "Bearer <token>" to get just the token part.
  // Optional chaining handles missing header gracefully.
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Authentication token is missing or invalid.',
    });
  }

  // jwt.verify() does three things:
  // 1. Decodes the base64 payload
  // 2. Recalculates signature using JWT_SECRET and compares it
  // 3. Checks 'exp' claim against current time
  // Throws error if signature mismatch OR token expired.
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach decoded payload to request object.
    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      error: 'Authentication token is missing or invalid.',
    });
  }
}
