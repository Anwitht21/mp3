var mongoose = require('mongoose');

module.exports = function() {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true })
        .then(() => {
            console.log('MongoDB connected successfully');
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });
};

