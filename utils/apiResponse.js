module.exports = {
    success: function(res, statusCode, message, data) {
        return res.status(statusCode).json({
            message: message,
            data: data
        });
    },
    
    error: function(res, statusCode, message, data) {
        return res.status(statusCode).json({
            message: message,
            data: data || {}
        });
    }
};

