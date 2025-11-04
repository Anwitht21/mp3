module.exports = function(req, res, next) {
    try {
        var queryParams = {};
        
        if (req.query.where) {
            queryParams.where = JSON.parse(req.query.where);
        }
        
        if (req.query.sort) {
            queryParams.sort = JSON.parse(req.query.sort);
        }
        
        if (req.query.select) {
            queryParams.select = JSON.parse(req.query.select);
        }
        
        if (req.query.skip !== undefined) {
            queryParams.skip = parseInt(req.query.skip, 10);
            if (isNaN(queryParams.skip)) {
                queryParams.skip = 0;
            }
        }
        
        if (req.query.limit !== undefined) {
            queryParams.limit = parseInt(req.query.limit, 10);
            if (isNaN(queryParams.limit)) {
                queryParams.limit = undefined;
            }
        }
        
        if (req.query.count !== undefined) {
            queryParams.count = req.query.count === 'true' || req.query.count === true;
        }
        
        req.parsedQuery = queryParams;
        next();
    } catch (error) {
        return res.status(400).json({
            message: 'Invalid JSON in query parameters',
            data: { error: error.message }
        });
    }
};

