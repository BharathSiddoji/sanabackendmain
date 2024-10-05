// Basic validation middleware functions

const validateUserInput = (req, res, next) => {
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
  
    if (!username || !password || !role || !firstName || !lastName || !email || 
        !dateOfBirth || !address || !jobRole || !dateOfJoining || !department || !employeeId || !pfNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }
  
    // Add more specific validations here if needed
  
    next();
  };
  
  const validateStatus = (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ['approved', 'rejected', 'pending']; // adjust based on your needs
  
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid status' });
    }
  
    next();
  };
  
  module.exports = {
    validateUserInput,
    validateStatus // Add this line
  };