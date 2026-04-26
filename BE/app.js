require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/user.route');
const hotelRoutes = require('./routes/hotel.route');
const bookingRoutes = require('./routes/booking.route');
const inventoryRoutes = require('./routes/inventory.route');
const placesRoutes = require('./routes/place.route');
const tripRoutes = require('./routes/trip.route');
const planRoutes = require('./routes/plan.route');

const chatbotRoutes = require ('./routes/chatbot.routes');
const notificationRoutes = require('./routes/notification.route');
const avatarItemRoutes = require('./routes/avatarItem.route');

var app = express();
connectDB();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OwnTrip API is running',
    version: '1.0.0',
  
  });
});

app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/avatar-items', avatarItemRoutes);


app.use(function(req, res, next) {
  res.status(404).json({ success: false, message: 'Route not found' });
});


app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
