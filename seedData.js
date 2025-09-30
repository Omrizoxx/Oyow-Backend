const mongoose = require('mongoose');
const Tour = require('./models/Tour');

// Sample tours data
const sampleTours = [
  {
    title: 'Mountain Adventure',
    description: 'Explore the beautiful mountain ranges with our experienced guides',
    price: 299,
    duration: 3,
    location: 'Mount Kenya, Kenya',
    image: '/assets/mountain-adventure.jpg',
    highlights: ['Mountain Climbing', 'Scenic Views', 'Expert Guides', 'Equipment Included'],
    rating: 4.8
  },
  {
    title: 'City Tour',
    description: 'Discover the hidden gems of the city with our local experts',
    price: 149,
    duration: 1,
    location: 'Nairobi, Kenya',
    image: '/assets/city-tour.jpg',
    highlights: ['Local Culture', 'Historical Sites', 'Food Tasting', 'Transport Included'],
    rating: 4.5
  },
  {
    title: 'Beach Paradise',
    description: 'Relax and enjoy the pristine beaches and crystal clear waters',
    price: 399,
    duration: 4,
    location: 'Diani Beach, Kenya',
    image: '/assets/beach-paradise.jpg',
    highlights: ['Beach Activities', 'Water Sports', 'Luxury Resort', 'All Inclusive'],
    rating: 4.9
  },
  {
    title: 'Safari Adventure',
    description: 'Experience the wild beauty of African wildlife in their natural habitat',
    price: 599,
    duration: 5,
    location: 'Maasai Mara, Kenya',
    image: '/assets/safari-adventure.jpg',
    highlights: ['Big Five Safari', 'Luxury Lodges', 'Expert Guides', 'Photography'],
    rating: 4.9
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/oyow-tours');
    console.log('Connected to MongoDB for seeding');

    // Clear existing tours
    await Tour.deleteMany({});
    console.log('Cleared existing tours');

    // Insert sample tours
    await Tour.insertMany(sampleTours);
    console.log('Sample tours inserted successfully');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
