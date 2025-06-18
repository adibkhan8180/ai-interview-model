export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.message === 'Session not found') {
        return res.status(404).json({
            success: false,
            message: 'Interview session not found'
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};