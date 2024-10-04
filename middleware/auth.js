const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const authorizeHR = (req, res, next) => {
  if (req.user.role !== 'hr') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

module.exports = { authenticateToken, authorizeHR };
