const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authenticateToken, authorizeHR } = require('../middleware/auth');

const router = express.Router();

router.post('/users', authenticateToken, authorizeHR, async (req, res) => {
  const { 
    username, 
    password, 
    role, 
    firstName, 
    lastName, 
    email, 
    dateOfBirth, 
    address, 
    jobRole, 
    dateOfJoining, 
    department,
    employeeId 
  } = req.body;

  // Input validation
  if (!username || !password || !role || !firstName || !lastName || !email || 
      !dateOfBirth || !address || !jobRole || !dateOfJoining || !department || !employeeId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Start a transaction
    await db.query('BEGIN');

    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await db.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, role]
    );
    const userId = userResult.rows[0].id;

    await db.query(
      `INSERT INTO employees (
        user_id, employee_id, first_name, last_name, email, date_of_birth, 
        address, job_role, date_of_joining, department
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, employeeId, firstName, lastName, email, dateOfBirth, 
       address, jobRole, dateOfJoining, department]
    );

    // Commit the transaction
    await db.query('COMMIT');

    res.status(201).json({ message: 'User and employee created successfully' });
  } catch (error) {
    // Rollback the transaction in case of error
    await db.query('ROLLBACK');
    console.error(error);
    if (error.constraint === 'employees_employee_id_key') {
      res.status(400).json({ error: 'Employee ID already exists' });
    } else if (error.constraint === 'employees_email_key') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/leave-requests', authenticateToken, authorizeHR, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM leave_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/leave-requests/:id', authenticateToken, authorizeHR, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE leave_requests SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Leave request updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/resignation-requests', authenticateToken, authorizeHR, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM resignation_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/resignation-requests/:id', authenticateToken, authorizeHR, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE resignation_requests SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Resignation request updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
