var mongoose = require('mongoose');

module.exports = function() {
    var options = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
    
    mongoose.connect(process.env.MONGODB_URI, options)
        .then(() => {
            console.log('MongoDB connected successfully');
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });
};

