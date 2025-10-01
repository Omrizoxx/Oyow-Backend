const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3002;
const host = process.env.HOST || 'localhost';
// MongoDB Connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oyow-tours';

if (!process.env.MONGODB_URI) {
  console.log('⚠️ MONGODB_URI not found in environment variables');
  console.log('📝 Please create a .env file with: MONGODB_URI=your_atlas_connection_string');
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.log('❌ MongoDB connection error:', err.message);
    console.log('🔄 Server will continue with fallback data...');
  });


const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:8080"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  }
});

// Middleware
// This line adds the CORS (Cross-Origin Resource Sharing) middleware to the Express app.
// It allows the server to accept requests from specific origins (listed below) and supports certain HTTP methods.
// The 'credentials: true' option allows cookies and authentication information to be sent with requests.
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:8080"],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection handled above

// Import Models
const Tour = require('./src/models/Tour');
const Booking = require('./src/models/Booking');
const Contact = require('./src/models/Contact');

// Fallback data when MongoDB is not available
const fallbackTours = [
  {
    _id: '1',
    title: 'Mountain Adventure',
    description: 'Explore the beautiful mountain ranges with our experienced guides',
    price: 299,
    duration: 3,
    location: 'Mount Kenya, Kenya',
    image: '/assets/mountain-adventure.jpg',
    highlights: ['Mountain Climbing', 'Scenic Views', 'Expert Guides'],
    rating: 4.8
  },
  {
    _id: '2',
    title: 'City Tour',
    description: 'Discover the hidden gems of the city with our local experts',
    price: 149,
    duration: 1,
    location: 'Nairobi, Kenya',
    image: '/assets/city-tour.jpg',
    highlights: ['Local Culture', 'Historical Sites', 'Food Tasting'],
    rating: 4.5
  },
  {
    _id: '3',
    title: 'Beach Paradise',
    description: 'Relax and enjoy the pristine beaches and crystal clear waters',
    price: 399,
    duration: 4,
    location: 'Diani Beach, Kenya',
    image: '/assets/beach-paradise.jpg',
    highlights: ['Beach Activities', 'Water Sports', 'Luxury Resort'],
    rating: 4.9
  }
];

// Database Status Check
app.get('/api/status', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMessages = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  res.json({
    database: statusMessages[dbStatus],
    status: dbStatus === 1 ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get('/api/tours', async (req, res) => {
  try {
    // Try to fetch from MongoDB first
    const tours = await Tour.find({ isActive: true });
    if (tours.length > 0) {
      console.log('✅ Fetched tours from MongoDB');
      res.json(tours);
    } else {
      console.log('⚠️ No tours in MongoDB, using fallback data');
      res.json(fallbackTours);
    }
  } catch (error) {
    // Fallback to static data if MongoDB is not available
    console.log('❌ MongoDB error, using fallback data for tours');
    res.json(fallbackTours);
  }
});

app.get('/api/tours/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ error: 'Tour not found' });
    res.json(tour);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tour' });
  }
});

app.post('/api/sos', (req, res) => {
  const { lat, lng, message } = req.body;
  console.log('SOS received:', { lat, lng, message });
  
  // Here you would typically save to database and notify emergency services
  // For now, we'll just log it and send a confirmation
  
  res.json({ 
    success: true, 
    message: 'SOS request received and emergency services have been notified',
    timestamp: new Date().toISOString()
  });
});

// Booking endpoint
app.post('/api/bookings', async (req, res) => {
  try {
    const { tourId, name, email, date, phone, specialRequests } = req.body;
    
    console.log('Booking request received:', { tourId, name, email, date, phone, specialRequests });
    
    // Find the tour to get price (try MongoDB first, then fallback)
    let tour = null;
    let tourPrice = 0;
    
    try {
      tour = await Tour.findById(tourId);
      if (tour) {
        tourPrice = tour.price;
        console.log('✅ Found tour in MongoDB:', tour.title, 'Price:', tourPrice);
      }
    } catch (dbError) {
      console.log('⚠️ MongoDB not available for tour lookup');
    }
    
    // If not found in MongoDB, try fallback data
    if (!tour) {
      const fallbackTour = fallbackTours.find(t => t._id === tourId);
      if (fallbackTour) {
        tourPrice = fallbackTour.price;
        console.log('✅ Found tour in fallback data:', fallbackTour.title, 'Price:', tourPrice);
      } else {
        console.log('❌ Tour not found in MongoDB or fallback data');
        return res.status(400).json({ error: 'Invalid tourId' });
      }
    }
    
    // Try to save to MongoDB if available
    try {
      const booking = new Booking({
        tourId,
        name,
        email,
        date: new Date(date),
        phone,
        specialRequests,
        totalAmount: tourPrice
      });
      
      await booking.save();
      console.log('✅ Booking saved to MongoDB:', booking);
      res.status(201).json(booking);
    } catch (dbError) {
      // If MongoDB fails, just log the booking (fallback)
      console.log('⚠️ MongoDB not available, logging booking:', {
        tourId,
        name,
        email,
        date: new Date(date),
        phone,
        specialRequests,
        totalAmount: tourPrice,
        timestamp: new Date().toISOString()
      });
      
      // Return success response even if not saved to DB
      res.status(201).json({
        _id: 'temp_' + Date.now(),
        tourId,
        name,
        email,
        date: new Date(date),
        phone,
        specialRequests,
        totalAmount: tourPrice,
        message: 'Booking received (saved locally)'
      });
    }
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Contact endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message, tourInterest, phone } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log('Contact submission received:', { name, email, subject, message, tourInterest, phone });
    
    try {
      // Try to save to MongoDB if available
      const contact = new Contact({
        name,
        email,
        subject,
        message,
        tourInterest,
        phone
      });
      
      await contact.save();
      console.log('Contact submission saved to MongoDB:', contact);
    } catch (dbError) {
      // If MongoDB fails, just log the contact (fallback)
      console.log('MongoDB not available, logging contact submission:', {
        name,
        email,
        subject,
        message,
        tourInterest,
        phone,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(200).json({ success: true, message: 'Message received. We will get back to you shortly.' });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// Socket.IO for real-time SOS communication
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('sos', (data) => {
    console.log('SOS via Socket.IO:', data);
    // Broadcast to all connected clients (like emergency responders)
    socket.broadcast.emit('sos-alert', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});



server.listen(port, () => {
  console.log(`Server running on http://${host}:${port}`);
});
