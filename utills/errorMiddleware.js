const errorMiddleware = (err, req, res, next) => {
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

    const isProduction = process.env.NODE_ENV === 'production';

    const errorResponse = {
        message: isProduction ? 'An unexpected error occurred' : err.message,
        error: isProduction ? {} : {
            stack: err.stack,
            details: err.details
        },
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    };

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json(errorResponse);
};

module.exports = errorMiddleware;