const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { authenticateToken, authorizeHR } = require('../middleware/auth');
const { validateUserInput, validateStatus } = require('../middleware/validation');

const router = express.Router();

router.post('/users', authenticateToken, authorizeHR, validateUserInput, async (req, res, next) => {
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
    employeeId,
    pfNumber,
  } = req.body;

  // Define allowed roles based on your database constraint
  const allowedRoles = ['admin', 'hr', 'employee']; // Adjust this list based on your actual allowed roles

  // Input validation
  if (!username || !password || !role || !firstName || !lastName || !email || 
      !dateOfBirth || !address || !jobRole || !dateOfJoining || !department || !employeeId || !pfNumber) {
    return res.status(400).json({ error: 'All fields are required', });
  }

  // Check if the role is allowed
  if (!allowedRoles.includes(role.toLowerCase())) {
    return res.status(400).json({ error: `Invalid role. Allowed roles are: ${allowedRoles.join(', ')}` });
  }

  try {
    // Start a transaction
    await db.query('BEGIN');

    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await db.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, role.toLowerCase()]
    );
    const userId = userResult.rows[0].id;

    await db.query(
      `INSERT INTO employees (
        user_id, employee_id, first_name, last_name, email, date_of_birth, 
        address, job_role, date_of_joining, department, pf_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [userId, employeeId, firstName, lastName, email, dateOfBirth, 
       address, jobRole, dateOfJoining, department, pfNumber]
    );

    // Commit the transaction
    await db.query('COMMIT');

    res.status(201).json({ message: 'User and employee created successfully' });
  } catch (error) {
    // Rollback the transaction in case of error
    await db.query('ROLLBACK');
    // console.error(error);
    next(error);
  }
});

router.get('/employees', authenticateToken, authorizeHR, async (req, res, next) => {
  // Parse the page and limit from query parameters
  // Frontend should include these in the request URL
  // Example: /api/hr/employees?page=2&limit=15
  const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 10;  // Default to 10 items per page if not provided

  // Calculate the offset based on the page and limit
  const offset = (page - 1) * limit;

  try {
    const result = await db.query(`
      SELECT e.*, u.username, u.role
      FROM employees e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.employee_id
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await db.query('SELECT COUNT(*) FROM employees');
    const totalEmployees = parseInt(countResult.rows[0].count);

    // Send response with pagination metadata
    // Frontend can use this information to display current page, total pages, and implement pagination controls
    res.json({
      employees: result.rows,
      currentPage: page,
      totalPages: Math.ceil(totalEmployees / limit),
      totalEmployees,
      itemsPerPage: limit
    });
  } catch (error) {
    next(error);
  }
});

router.get('/leave-requests', authenticateToken, authorizeHR, async (req, res,next) => {
  try {
    const result = await db.query('SELECT * FROM leave_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.put('/leave-requests/:id', authenticateToken, authorizeHR, validateStatus, async (req, res,next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE leave_requests SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Leave request updated successfully' });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/resignation-requests', authenticateToken, authorizeHR, async (req, res,next) => {
  try {
    const result = await db.query('SELECT * FROM resignation_requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.put('/resignation-requests/:id', authenticateToken, authorizeHR, async (req, res,next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE resignation_requests SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Resignation request updated successfully' });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
