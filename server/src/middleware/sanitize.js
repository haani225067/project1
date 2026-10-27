/**
 * Middleware to sanitize request bodies, queries, and params against NoSQL operator injection.
 * Strips out or sanitizes any object keys that begin with '$' or contain '.'.
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(obj)) {
    // If the key starts with '$' (Mongo operator) or contains '.', ignore/strip it
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleanObj[key] = sanitizeObject(value);
  }
  return cleanObj;
};

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = sanitizeInput;
