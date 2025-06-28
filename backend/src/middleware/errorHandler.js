
export const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const statusCode = err.statusCode || 500;

  let message = "Internal server error";

  if (err.isOperational && err.message) {
    message = err.message;
  } else if (err.name === 'ValidationError') {
    message = "Validation error: " + err.message;
  } else if (err.name === 'CastError') {
    message = "Invalid ID format";
  } else if (err.code === 11000) {
    message = "Duplicate entry error";
  }

  const response = {
    success: false,
    message,
  };

  res.status(statusCode).json(response);
};
