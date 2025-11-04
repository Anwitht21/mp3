module.exports = async function buildQuery(Model, queryParams, defaultLimit) {
    var query = Model.find(queryParams.where || {});
    
    if (queryParams.sort) {
        query = query.sort(queryParams.sort);
    }
    
    if (queryParams.select) {
        query = query.select(queryParams.select);
    }
    
    if (queryParams.skip !== undefined) {
        query = query.skip(queryParams.skip);
    }
    
    if (queryParams.limit !== undefined) {
        query = query.limit(queryParams.limit);
    } else if (defaultLimit !== undefined) {
        query = query.limit(defaultLimit);
    }
    
    if (queryParams.count) {
        var countQuery = Model.countDocuments(queryParams.where || {});
        return await countQuery.exec();
    }
    
    return await query.exec();
};

