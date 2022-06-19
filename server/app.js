const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

const { default_error_handler } = require('./middlewares/error_handling')

const corsOptions = {
    origin: require('./config/client.config').origin,
    exposedHeaders: ["Content-Disposition"]
};

const fileUploadOptions = {
    useTempFiles: true,
    tempFileDir: "./storage/tmp"
}

var app = express();

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload(fileUploadOptions));

app.use('/fs', require('./routes/file_system'));
app.use('/auth', require('./routes/auth'));

app.use(default_error_handler);

module.exports = app;
