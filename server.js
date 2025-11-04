var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser');

require('dotenv').config();

var app = express();

var port = process.env.PORT || 3000;

require('./config/db')();

var allowCrossDomain = function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
    next();
};
app.use(allowCrossDomain);

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

require('./routes')(app, router);

var errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.listen(port);
console.log('Server running on port ' + port);
