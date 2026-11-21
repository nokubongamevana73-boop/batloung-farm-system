/**
 * Central Error Handler Middleware
 * Formats errors into structured, meaningful JSON responses
 * with standard HTTP status codes.
 */
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle specific MySQL errors
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        statusCode = 409; // Conflict
        message = 'A record with the provided unique information already exists.';
        break;

      case 'ER_ROW_IS_REFERENCED_2':
      case 'ER_ROW_IS_REFERENCED':
        statusCode = 400; // Bad Request
        message = 'Cannot delete or modify record because it is referenced by other records (e.g. sales, purchases, or stock).';
        break;

      case 'ER_NO_REFERENCED_ROW_2':
      case 'ER_NO_REFERENCED_ROW':
        statusCode = 400; // Bad Request
        message = 'Referenced entity does not exist (invalid foreign key ID).';
        break;

      case 'ER_CHECK_CONSTRAINT_VIOLATED':
        statusCode = 400; // Bad Request
        message = 'Database constraint violated: ' + (err.sqlMessage || err.message);
        break;

      case 'ECONNREFUSED':
      case 'ETIMEDOUT':
      case 'PROTOCOL_CONNECTION_LOST':
        statusCode = 503; // Service Unavailable
        message = 'Database server is unreachable. Please verify MySQL service is running.';
        break;

      default:
        // Keep 500 or err.statusCode
        break;
    }
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: message,
    details: details || (process.env.NODE_ENV === 'development' ? err.sqlMessage || err.stack : undefined)
  });
}

module.exports = errorHandler;
