const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  // Extract username and password from request body
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Query the database for the user
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    
    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get the user object
    const user = result.rows[0];

    // Check if the password is hashed and exists
    if (!user.password || typeof user.password !== 'string') {
      // Log the error for debugging purposes, including the username for easier identification
      console.error('User password is not properly hashed:', user.username);
      
      // Return a generic error message to the client to avoid exposing sensitive information
      // We use a 500 status code to indicate a server-side error
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Compare provided password with stored hash
    const validPassword = await bcrypt.compare(password, user.password);
    
    // If password is invalid, return error
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if JWT_SECRET is set in environment variables
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Generate a JWT token containing the user's id and role
    const token = jwt.sign(
      { id: user.id, role: user.role,employeeId:user.employeeId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send the token and user role in the response
    res.json({ token, role: user.role,employeeId:user.employeeId });
  } catch (error) {
    // Log the error for debugging
    console.error('Login error:', error);
    
    // Check for database connection error
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Database connection error' });
    }
    
    // Generic error response
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
