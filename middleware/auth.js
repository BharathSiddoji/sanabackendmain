const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    next();
  });
};

const authorizeHR = (req, res, next) => {
  if (req.user && req.user.role === 'hr') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. HR role required.' });
  }
};

module.exports = { authenticateToken, authorizeHR };
