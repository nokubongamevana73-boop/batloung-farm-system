/**
 * 404 Not Found Middleware for unknown routes
 */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    status: 404,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = notFound;
