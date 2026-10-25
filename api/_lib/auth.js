const crypto = require('crypto');

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Dashboard requests send the admin password as a bearer token
function isAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const header = req.headers.authorization || '';
  return Boolean(expected) && safeEqual(header.replace(/^Bearer /, ''), expected);
}

module.exports = { safeEqual, isAdmin };
