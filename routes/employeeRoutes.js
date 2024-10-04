const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM employees WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/leave-requests', authenticateToken, async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  try {
    const employeeResult = await db.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const employeeId = employeeResult.rows[0].id;
    await db.query(
      'INSERT INTO leave_requests (employee_id, start_date, end_date, reason) VALUES ($1, $2, $3, $4)',
      [employeeId, startDate, endDate, reason]
    );
    res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/resignation-requests', authenticateToken, async (req, res) => {
  const { resignationDate, reason } = req.body;
  try {
    const employeeResult = await db.query('SELECT id FROM employees WHERE user_id = $1', [req.user.id]);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const employeeId = employeeResult.rows[0].id;
    await db.query(
      'INSERT INTO resignation_requests (employee_id, resignation_date, reason) VALUES ($1, $2, $3)',
      [employeeId, resignationDate, reason]
    );
    res.status(201).json({ message: 'Resignation request submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
