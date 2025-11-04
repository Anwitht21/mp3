module.exports = function(err, req, res, next) {
    if (err.code === 11000) {
        var field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            message: 'Duplicate entry: ' + field + ' already exists',
            data: { field: field }
        });
    }
    
    if (err.name === 'ValidationError') {
        var errors = {};
        for (var field in err.errors) {
            errors[field] = err.errors[field].message;
        }
        return res.status(400).json({
            message: 'Validation error',
            data: errors
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'Invalid ID format',
            data: { error: 'The provided ID is not valid' }
        });
    }
    
    console.error('Server error:', err);
    return res.status(500).json({
        message: 'Internal server error',
        data: {}
    });
};

