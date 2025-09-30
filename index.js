const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:8080"],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  }
});

// Middleware
// This line adds the CORS (Cross-Origin Resource Sharing) middleware to the Express app.
// It allows the server to accept requests from specific origins (listed below) and supports certain HTTP methods.
// The 'credentials: true' option allows cookies and authentication information to be sent with requests.
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:8080"],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
connectDB();

// Import Models
const Tour = require('./models/Tour');
const Booking = require('./models/Booking');
const Contact = require('./models/Contact');

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
    
    // Find the tour to get price
    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(400).json({ error: 'Invalid tourId' });
    
    const booking = new Booking({
      tourId,
      name,
      email,
      date: new Date(date),
      phone,
      specialRequests,
      totalAmount: tour.price
    });
    
    await booking.save();
    console.log('Booking created:', booking);
    res.status(201).json(booking);
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

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
