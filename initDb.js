require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

async function createAdminUser() {
  const adminUsername = 'admin';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const adminRole = 'hr';

  if (!adminPassword) {
    console.error('ADMIN_INITIAL_PASSWORD is not set in the environment variables');
    process.exit(1);
  }

  try {
    // Check if admin user already exists
    const checkResult = await db.query('SELECT * FROM users WHERE username = $1', [adminUsername]);
    
    if (checkResult.rows.length === 0) {
      // Admin user doesn't exist, create one
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const insertResult = await db.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
        [adminUsername, hashedPassword, adminRole]
      );
      
      const userId = insertResult.rows[0].id;
      
      // Create a corresponding entry in the employees table
      await db.query(
        'INSERT INTO employees (user_id, first_name, last_name, email, employee_id, date_of_birth, address, job_role, date_of_joining, department) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [userId, 'Admin', 'User', 'admin@example.com', 'ADMIN001', '1990-01-01', 'Admin Address', 'HR Manager', new Date().toISOString().split('T')[0], 'Human Resources']
      );
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser().then(() => {
  console.log('Database initialization complete');
  process.exit();
});
