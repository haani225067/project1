/**
 * 404 Not Found Middleware for handling undefined routes
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.method} ${req.originalUrl}`,
    data: null,
  });
};

module.exports = notFound;
