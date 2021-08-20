var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const db = require('./src/helpers/dbConnect');
require('./src/helpers/_error').guard();
const cors = require('cors');
const requestIP = require('request-ip');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');

var app = express();

db.connect();

app.use(cors({
    // origin: (origin, callback) => callback(null, true),
    origin: process.env.CLIENT_URL,
    credentials: true
}));
// app.use(cors());
app.use(requestIP.mw());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);



const server = app.listen(process.env.PORT || 4000,
    () => console.log("Server is running...", process.env.PORT || 4000));

// SOCKET
const socket = require('socket.io');
const io = socket(server);
TickersSocketChannelHandler(io, socket);

io.on('connection', socket => {
    console.log('A client connected!');
    // start streaming currency data from coinbase
    // TickersSocketChannelHandler(io, socket);
});

module.exports = app;
