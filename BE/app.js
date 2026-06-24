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
const paymentRoutes = require('./routes/payment.route');
const avatarItemRoutes = require('./routes/avatarItem.route');
const systemRoutes = require('./routes/system.route');
const hotelRequestRoutes = require('./routes/hotelRequest.route');
const creatorPackageRoutes = require('./routes/creatorPackage.routes');
const checkinRoutes = require('./routes/checkin.route');
const withdrawalRoutes = require('./routes/withdrawal.route');
const frameRoutes = require('./routes/frame.route');
const aiRoutes = require('./routes/ai.route');
const weatherRoutes = require('./routes/weather.routes');
var app = express();
connectDB();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

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
app.use('/api/payment', paymentRoutes);
app.use('/api/avatar-items', avatarItemRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/hotel-requests', hotelRequestRoutes);
app.use('/api/creator-packages', creatorPackageRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/frames', frameRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/weather', weatherRoutes);

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
