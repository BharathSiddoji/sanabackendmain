const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Add this line
const authRoutes = require('./routes/authRoutes');
const hrRoutes = require('./routes/hrRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const errorMiddleware = require('./utills/errorMiddleware');
const bodyParser = require('body-parser');
const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add this line here
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// Use the route files
app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/employee', employeeRoutes);

// Use error middleware last
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});

// Global error handler
app.use((err, req, res, next) => {
  // Log the error details
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    
    query: req.query,
    params: req.params
  });

  // Determine if we're in development or production
  const isProduction = process.env.NODE_ENV === 'production';

  // Prepare the error response
  const errorResponse = {
    message: isProduction ? 'An unexpected error occurred' : err.message,
    error: isProduction ? { 
      message: err.message,
      stack: err.stack,
      details: err.details, // If you're using custom error objects with a details field
      errors:err.errors
    } : {
      stack: err.stack,
      details: err.details // If you're using custom error objects with a details field
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Set the appropriate status code
  const statusCode = err.statusCode || 500;

  // Send the error response
  res.status(statusCode).json(errorResponse);
});