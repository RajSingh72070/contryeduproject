/**
 * Clean XSS strings stripping markup tags and script blocks recursively
 * @param {any} input Request payloads
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  // Strip script tags and HTML elements
  return input
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Strip script tags
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/on\w+="[^"]*"/g, '') // Strip inline listeners like onclick
    .trim();
};

const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const cleanObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cleanObj[key] = sanitizeObject(obj[key]);
      }
    }
    return cleanObj;
  }

  return sanitizeString(obj);
};

export const sanitize = (req, res, next) => {
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
