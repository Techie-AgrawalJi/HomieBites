import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

import mongoose from 'mongoose';
import User from './models/User';
import Provider from './models/Provider';
import PGListing from './models/PGListing';
import MealService from './models/MealService';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Provider.deleteMany({});
  await PGListing.deleteMany({});
  await MealService.deleteMany({});

  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@homiebites.com',
    phone: '9999999999',
    city: 'Mumbai',
    password: 'password123',
    role: 'superadmin',
  });

  const providerUsers = await User.create([
    { name: 'Rahul Sharma', email: 'rahul@homiebites.com', phone: '9876543210', city: 'Bangalore', password: 'password123', role: 'provider' },
    { name: 'Priya Nair', email: 'priya@homiebites.com', phone: '9876543211', city: 'Pune', password: 'password123', role: 'provider' },
    { name: 'Amit Singh', email: 'amit@homiebites.com', phone: '9876543212', city: 'Delhi', password: 'password123', role: 'provider' },
    { name: 'Sneha Patel', email: 'sneha@homiebites.com', phone: '9876543213', city: 'Hyderabad', password: 'password123', role: 'provider' },
  ]);

  const testUser = await User.create({
    name: 'Test User',
    email: 'user@homiebites.com',
    phone: '9876543200',
    city: 'Bangalore',
    password: 'password123',
    role: 'user',
  });

  const providers = await Provider.create([
    {
      user: providerUsers[0]._id,
      businessName: 'Sharma PG Homes',
      businessPhone: '9876543210',
      businessEmail: 'rahul@homiebites.com',
      businessAddress: 'Koramangala, Bangalore',
      city: 'Bangalore',
      serviceType: 'both',
      location: { type: 'Point', coordinates: [77.6245, 12.9352] },
      status: 'approved',
    },
    {
      user: providerUsers[1]._id,
      businessName: 'Nair Residences',
      businessPhone: '9876543211',
      businessEmail: 'priya@homiebites.com',
      businessAddress: 'Baner, Pune',
      city: 'Pune',
      serviceType: 'pg',
      location: { type: 'Point', coordinates: [73.7898, 18.5590] },
      status: 'approved',
    },
    {
      user: providerUsers[2]._id,
      businessName: 'Singh Mess Services',
      businessPhone: '9876543212',
      businessEmail: 'amit@homiebites.com',
      businessAddress: 'Lajpat Nagar, Delhi',
      city: 'Delhi',
      serviceType: 'meal',
      location: { type: 'Point', coordinates: [77.2335, 28.5672] },
      status: 'approved',
    },
    {
      user: providerUsers[3]._id,
      businessName: 'Patel Homes',
      businessPhone: '9876543213',
      businessEmail: 'sneha@homiebites.com',
      businessAddress: 'Banjara Hills, Hyderabad',
      city: 'Hyderabad',
      serviceType: 'both',
      location: { type: 'Point', coordinates: [78.4390, 17.4156] },
      status: 'approved',
    },
  ]);

  const pgPhotos = [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
  ];

  await PGListing.create([
    {
      provider: providers[0]._id,
      name: 'Koramangala Executive PG',
      description: 'Premium fully furnished PG in the heart of Koramangala with all modern amenities. Walking distance from tech parks and restaurants.',
      address: '5th Cross, Koramangala 4th Block, Bangalore',
      city: 'Bangalore',
      landmark: 'Sony World Junction',
      distanceFromLandmark: '0.5 km',
      gender: 'male',
      furnishing: 'furnished',
      roomTypes: [
        { type: 'Single', price: 12000, availability: 3, total: 5 },
        { type: 'Double Sharing', price: 8000, availability: 5, total: 8 },
        { type: 'Triple Sharing', price: 6000, availability: 2, total: 4 },
      ],
      amenities: ['WiFi', 'AC', 'Geyser', 'Laundry', 'Food', 'Security', 'Parking'],
      rules: ['No smoking', 'No pets', 'Visitors allowed till 10 PM', 'Gate closes at 11 PM'],
      photos: pgPhotos.slice(0, 4),
      tags: ['Premium', 'Tech Park Nearby', 'Metro Access'],
      location: { type: 'Point', coordinates: [77.6245, 12.9352] },
      featured: true,
      verified: true,
      averageRating: 4.5,
      reviewCount: 28,
      contactName: 'Rahul Sharma',
      contactPhone: '9876543210',
      minPrice: 6000,
    },
    {
      provider: providers[0]._id,
      name: 'Indiranagar Girls PG',
      description: 'Safe and secure girls-only PG in the vibrant Indiranagar area. Well-connected by metro and home-cooked food available.',
      address: '100 Feet Road, Indiranagar, Bangalore',
      city: 'Bangalore',
      landmark: 'Indiranagar Metro Station',
      distanceFromLandmark: '0.3 km',
      gender: 'female',
      furnishing: 'furnished',
      roomTypes: [
        { type: 'Single', price: 14000, availability: 2, total: 4 },
        { type: 'Double Sharing', price: 9000, availability: 4, total: 6 },
      ],
      amenities: ['WiFi', 'AC', 'Geyser', 'Food', 'Security', 'CCTV', 'Power Backup'],
      rules: ['Girls only', 'No smoking', 'Gate closes at 10 PM'],
      photos: pgPhotos.slice(1, 5),
      tags: ['Girls Only', 'Metro Nearby', 'Home Food'],
      location: { type: 'Point', coordinates: [77.6408, 12.9784] },
      featured: true,
      verified: true,
      averageRating: 4.7,
      reviewCount: 45,
      contactName: 'Rahul Sharma',
      contactPhone: '9876543210',
      minPrice: 9000,
    },
    {
      provider: providers[1]._id,
      name: 'Baner Premium Residence',
      description: 'Modern PG accommodation in the IT hub of Baner with amenities for working professionals.',
      address: 'Baner Road, Near Balewadi Stadium, Pune',
      city: 'Pune',
      landmark: 'Balewadi Stadium',
      distanceFromLandmark: '1 km',
      gender: 'unisex',
      furnishing: 'furnished',
      roomTypes: [
        { type: 'Single', price: 11000, availability: 4, total: 6 },
        { type: 'Double Sharing', price: 7500, availability: 3, total: 5 },
      ],
      amenities: ['WiFi', 'AC', 'Geyser', 'Gym', 'Laundry', 'Security', 'Parking'],
      rules: ['No smoking', 'No alcohol', 'Visitors by appointment'],
      photos: pgPhotos.slice(2, 6),
      tags: ['IT Hub', 'Unisex', 'Gym Access'],
      location: { type: 'Point', coordinates: [73.7898, 18.5590] },
      featured: false,
      verified: true,
      averageRating: 4.3,
      reviewCount: 19,
      contactName: 'Priya Nair',
      contactPhone: '9876543211',
      minPrice: 7500,
    },
    {
      provider: providers[1]._id,
      name: 'Kothrud Student House',
      description: 'Budget-friendly student accommodation near COEP and FC Road. Great location for college students.',
      address: 'Law College Road, Kothrud, Pune',
      city: 'Pune',
      landmark: 'FC Road',
      distanceFromLandmark: '0.8 km',
      gender: 'male',
      furnishing: 'semi-furnished',
      roomTypes: [
        { type: 'Double Sharing', price: 5500, availability: 6, total: 10 },
        { type: 'Triple Sharing', price: 4000, availability: 4, total: 6 },
      ],
      amenities: ['WiFi', 'Geyser', 'Food', 'Study Room', 'Security'],
      rules: ['Students preferred', 'No smoking', 'Quiet hours 10 PM - 6 AM'],
      photos: pgPhotos.slice(3, 7),
      tags: ['Student Friendly', 'Budget', 'College Area'],
      location: { type: 'Point', coordinates: [73.8140, 18.5018] },
      featured: false,
      verified: true,
      averageRating: 4.1,
      reviewCount: 33,
      contactName: 'Priya Nair',
      contactPhone: '9876543211',
      minPrice: 4000,
    },
    {
      provider: providers[3]._id,
      name: 'Banjara Hills Executive Stay',
      description: 'Luxury PG accommodation in the upscale Banjara Hills neighborhood. Perfect for corporate professionals.',
      address: 'Road No. 12, Banjara Hills, Hyderabad',
      city: 'Hyderabad',
      landmark: 'GVK One Mall',
      distanceFromLandmark: '0.7 km',
      gender: 'unisex',
      furnishing: 'furnished',
      roomTypes: [
        { type: 'Single', price: 18000, availability: 2, total: 4 },
        { type: 'Double Sharing', price: 12000, availability: 3, total: 5 },
      ],
      amenities: ['WiFi', 'AC', 'Geyser', 'Swimming Pool', 'Gym', 'Housekeeping', 'Security'],
      rules: ['Professionals only', 'No smoking indoors', 'Guest policy applies'],
      photos: pgPhotos.slice(0, 4),
      tags: ['Luxury', 'Corporate', 'Pool Access'],
      location: { type: 'Point', coordinates: [78.4390, 17.4156] },
      featured: true,
      verified: true,
      averageRating: 4.8,
      reviewCount: 22,
      contactName: 'Sneha Patel',
      contactPhone: '9876543213',
      minPrice: 12000,
    },
    {
      provider: providers[3]._id,
      name: 'Gachibowli Tech Nest',
      description: 'Affordable PG close to the HITEC City and Gachibowli IT corridor. Metro and cab services readily available.',
      address: 'Nanakramguda, Gachibowli, Hyderabad',
      city: 'Hyderabad',
      landmark: 'Mindspace IT Park',
      distanceFromLandmark: '0.4 km',
      gender: 'male',
      furnishing: 'furnished',
      roomTypes: [
        { type: 'Single', price: 10000, availability: 5, total: 8 },
        { type: 'Double Sharing', price: 7000, availability: 4, total: 7 },
        { type: 'Triple Sharing', price: 5000, availability: 3, total: 5 },
      ],
      amenities: ['WiFi', 'AC', 'Geyser', 'Laundry', 'Cafeteria', 'Security', 'Parking'],
      rules: ['No smoking', 'No alcohol', 'Gate closes at midnight'],
      photos: pgPhotos.slice(1, 5),
      tags: ['IT Corridor', 'Metro Nearby', 'Cafeteria'],
      location: { type: 'Point', coordinates: [78.3569, 17.4401] },
      featured: false,
      verified: true,
      averageRating: 4.4,
      reviewCount: 41,
      contactName: 'Sneha Patel',
      contactPhone: '9876543213',
      minPrice: 5000,
    },
    {
      provider: providers[2]._id,
      name: 'Lajpat Nagar Comfort Stay',
      description: 'Well-maintained PG in central Delhi with excellent metro connectivity and home-cooked meals.',
      address: 'Central Market, Lajpat Nagar, New Delhi',
      city: 'Delhi',
      landmark: 'Lajpat Nagar Metro',
      distanceFromLandmark: '0.2 km',
      gender: 'female',
      furnishing: 'furnished',
      roomTypes: [
        { type: 'Single', price: 13000, availability: 3, total: 5 },
        { type: 'Double Sharing', price: 9000, availability: 4, total: 7 },
      ],
      amenities: ['WiFi', 'AC', 'Geyser', 'Food', 'Security', 'CCTV'],
      rules: ['Girls only', 'No smoking', 'Visitors till 9 PM'],
      photos: pgPhotos.slice(2, 6),
      tags: ['Girls Only', 'Metro Access', 'Home Food'],
      location: { type: 'Point', coordinates: [77.2335, 28.5672] },
      featured: false,
      verified: true,
      averageRating: 4.2,
      reviewCount: 17,
      contactName: 'Amit Singh',
      contactPhone: '9876543212',
      minPrice: 9000,
    },
    {
      provider: providers[2]._id,
      name: 'Hauz Khas Village PG',
      description: 'Trendy PG accommodation in the artsy Hauz Khas Village. Perfect for young professionals and creatives.',
      address: 'Hauz Khas Village, South Delhi',
      city: 'Delhi',
      landmark: 'Hauz Khas Fort',
      distanceFromLandmark: '0.1 km',
      gender: 'unisex',
      furnishing: 'furnished',
      roomTypes: [
        { type: 'Single', price: 16000, availability: 2, total: 4 },
        { type: 'Double Sharing', price: 11000, availability: 3, total: 5 },
      ],
      amenities: ['WiFi', 'AC', 'Geyser', 'Rooftop Terrace', 'Laundry', 'Security'],
      rules: ['No loud music after 11 PM', 'Pets allowed', 'Respectful community'],
      photos: pgPhotos.slice(3, 7),
      tags: ['Creative Hub', 'Rooftop', 'Artsy Neighborhood'],
      location: { type: 'Point', coordinates: [77.1957, 28.5494] },
      featured: true,
      verified: true,
      averageRating: 4.6,
      reviewCount: 29,
      contactName: 'Amit Singh',
      contactPhone: '9876543212',
      minPrice: 11000,
    },
  ]);

  const mealPhotos = [
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
  ];

  await MealService.create([
    {
      provider: providers[0]._id,
      providerName: 'Sharma\'s Home Kitchen',
      description: 'Authentic North Indian home-cooked meals prepared with love. Serving Bangalore\'s tech community since 2018.',
      address: 'Koramangala 5th Block, Bangalore',
      city: 'Bangalore',
      cuisines: ['North Indian', 'Punjabi'],
      dietTypes: ['Vegetarian', 'Non-Vegetarian'],
      mealTimings: ['Breakfast', 'Lunch', 'Dinner'],
      plans: [
        { name: 'Basic', price: 3000, duration: '1 Month', mealsPerDay: 2 },
        { name: 'Standard', price: 4500, duration: '1 Month', mealsPerDay: 3 },
        { name: 'Premium', price: 6000, duration: '1 Month', mealsPerDay: 3 },
      ],
      deliveryRadius: 3,
      sampleMenu: [
        { day: 'Monday', items: ['Poha', 'Dal Tadka', 'Roti', 'Jeera Rice', 'Sabzi'] },
        { day: 'Tuesday', items: ['Idli', 'Rajma Chawal', 'Phulka', 'Paneer Butter Masala'] },
        { day: 'Wednesday', items: ['Upma', 'Chole Bhature', 'Dal Makhani', 'Naan'] },
        { day: 'Thursday', items: ['Paratha', 'Kadhi Pakora', 'Jeera Aloo', 'Rice'] },
        { day: 'Friday', items: ['Poha', 'Matar Paneer', 'Roti', 'Pulao'] },
        { day: 'Saturday', items: ['Aloo Puri', 'Special Thali', 'Kheer'] },
        { day: 'Sunday', items: ['Chole Puri', 'Biryani', 'Raita', 'Gulab Jamun'] },
      ],
      photos: mealPhotos.slice(0, 3),
      kitchenPhotos: mealPhotos.slice(3, 5),
      location: { type: 'Point', coordinates: [77.6267, 12.9349] },
      featured: true,
      verified: true,
      averageRating: 4.6,
      reviewCount: 52,
      contactPhone: '9876543210',
      minPrice: 3000,
    },
    {
      provider: providers[3]._id,
      providerName: 'South Spice Kitchen',
      description: 'Authentic South Indian tiffin service and full meals. Specializing in Andhra and Hyderabadi cuisine.',
      address: 'Banjara Hills Road No. 10, Hyderabad',
      city: 'Hyderabad',
      cuisines: ['South Indian', 'Andhra', 'Hyderabadi'],
      dietTypes: ['Vegetarian', 'Non-Vegetarian'],
      mealTimings: ['Breakfast', 'Lunch', 'Dinner'],
      plans: [
        { name: 'Tiffin Only', price: 2000, duration: '1 Month', mealsPerDay: 1 },
        { name: 'Full Day', price: 4000, duration: '1 Month', mealsPerDay: 3 },
        { name: 'Biryani Special', price: 5500, duration: '1 Month', mealsPerDay: 3 },
      ],
      deliveryRadius: 4,
      sampleMenu: [
        { day: 'Monday', items: ['Idli Vada', 'Sambar Rice', 'Chicken Curry', 'Rasam'] },
        { day: 'Tuesday', items: ['Dosa', 'Bisi Bele Bath', 'Hyderabadi Biryani'] },
        { day: 'Wednesday', items: ['Pesarattu', 'Pulihora', 'Mutton Curry', 'Curd Rice'] },
        { day: 'Thursday', items: ['Medu Vada', 'Vangi Bath', 'Fish Curry', 'Papad'] },
        { day: 'Friday', items: ['Upma', 'Vegetable Curry', 'Biryani', 'Raita'] },
        { day: 'Saturday', items: ['Special Thali', 'Gulab Jamun', 'Mutton Biryani'] },
        { day: 'Sunday', items: ['Full South Indian Feast', 'Payasam', 'Appam'] },
      ],
      photos: mealPhotos.slice(1, 4),
      kitchenPhotos: mealPhotos.slice(4, 6),
      location: { type: 'Point', coordinates: [78.4412, 17.4178] },
      featured: true,
      verified: true,
      averageRating: 4.8,
      reviewCount: 38,
      contactPhone: '9876543213',
      minPrice: 2000,
    },
    {
      provider: providers[2]._id,
      providerName: 'Delhi Dhaba Express',
      description: 'Classic North Indian street food flavors in a hygienic tiffin service. Serving the Delhi NCR tech community.',
      address: 'Lajpat Nagar Market, New Delhi',
      city: 'Delhi',
      cuisines: ['North Indian', 'Street Food', 'Mughlai'],
      dietTypes: ['Vegetarian', 'Non-Vegetarian'],
      mealTimings: ['Lunch', 'Dinner'],
      plans: [
        { name: 'Lunch Only', price: 1800, duration: '1 Month', mealsPerDay: 1 },
        { name: 'Dinner Only', price: 2000, duration: '1 Month', mealsPerDay: 1 },
        { name: 'Full Day', price: 3500, duration: '1 Month', mealsPerDay: 2 },
      ],
      deliveryRadius: 5,
      sampleMenu: [
        { day: 'Monday', items: ['Rajma Chawal', 'Roti', 'Salad', 'Lassi'] },
        { day: 'Tuesday', items: ['Chole Bhature', 'Dal Makhani', 'Naan'] },
        { day: 'Wednesday', items: ['Paneer Tikka', 'Butter Naan', 'Dal Fry', 'Raita'] },
        { day: 'Thursday', items: ['Aloo Gobi', 'Roti', 'Rice', 'Dahi'] },
        { day: 'Friday', items: ['Mutton Curry', 'Biryani', 'Papad', 'Chutney'] },
        { day: 'Saturday', items: ['Special Thali', 'Kheer', 'Gulab Jamun'] },
        { day: 'Sunday', items: ['Nahari', 'Sheermal', 'Phirni', 'Kebabs'] },
      ],
      photos: mealPhotos.slice(2, 5),
      kitchenPhotos: mealPhotos.slice(0, 2),
      location: { type: 'Point', coordinates: [77.2350, 28.5665] },
      featured: false,
      verified: true,
      averageRating: 4.3,
      reviewCount: 27,
      contactPhone: '9876543212',
      minPrice: 1800,
    },
    {
      provider: providers[1]._id,
      providerName: 'Pune Veg Delight',
      description: 'Pure vegetarian tiffin service inspired by Maharashtrian home cooking. Healthy, tasty, and affordable.',
      address: 'Baner Gaon, Baner, Pune',
      city: 'Pune',
      cuisines: ['Maharashtrian', 'Gujarati'],
      dietTypes: ['Vegetarian', 'Vegan'],
      mealTimings: ['Breakfast', 'Lunch', 'Dinner'],
      plans: [
        { name: 'Student Pack', price: 2500, duration: '1 Month', mealsPerDay: 2 },
        { name: 'Office Pack', price: 3800, duration: '1 Month', mealsPerDay: 3 },
      ],
      deliveryRadius: 3,
      sampleMenu: [
        { day: 'Monday', items: ['Poha', 'Varan Bhat', 'Bhakri', 'Amti'] },
        { day: 'Tuesday', items: ['Thalipeeth', 'Pav Bhaji', 'Matki Usal'] },
        { day: 'Wednesday', items: ['Misal Pav', 'Pitla Bhakri', 'Koshimbir'] },
        { day: 'Thursday', items: ['Sabudana Khichdi', 'Sol Kadhi', 'Bhindi Sabzi', 'Roti'] },
        { day: 'Friday', items: ['Puran Poli', 'Katachi Amti', 'Masala Bhat'] },
        { day: 'Saturday', items: ['Ukdiche Modak', 'Special Thali', 'Shrikhand'] },
        { day: 'Sunday', items: ['Batata Wada', 'Dum Aloo', 'Kadhi', 'Kheer'] },
      ],
      photos: mealPhotos.slice(0, 3),
      kitchenPhotos: mealPhotos.slice(3, 6),
      location: { type: 'Point', coordinates: [73.7920, 18.5620] },
      featured: false,
      verified: true,
      averageRating: 4.5,
      reviewCount: 31,
      contactPhone: '9876543211',
      minPrice: 2500,
    },
    {
      provider: providers[0]._id,
      providerName: 'BangaloreMeals Co.',
      description: 'Healthy and nutritious meal subscription service for working professionals in Bangalore\'s tech belt.',
      address: 'HSR Layout Sector 2, Bangalore',
      city: 'Bangalore',
      cuisines: ['South Indian', 'North Indian', 'Continental'],
      dietTypes: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Keto'],
      mealTimings: ['Breakfast', 'Lunch', 'Dinner'],
      plans: [
        { name: 'Keto Plan', price: 5000, duration: '1 Month', mealsPerDay: 3 },
        { name: 'Vegan Plan', price: 4200, duration: '1 Month', mealsPerDay: 3 },
        { name: 'Mix Plan', price: 3800, duration: '1 Month', mealsPerDay: 3 },
      ],
      deliveryRadius: 5,
      sampleMenu: [
        { day: 'Monday', items: ['Oats Bowl', 'Quinoa Salad', 'Grilled Chicken', 'Soup'] },
        { day: 'Tuesday', items: ['Smoothie Bowl', 'Brown Rice Bowl', 'Tofu Stir Fry'] },
        { day: 'Wednesday', items: ['Avocado Toast', 'Mediterranean Bowl', 'Grilled Fish'] },
        { day: 'Thursday', items: ['Granola', 'Lentil Soup', 'Veggie Wrap', 'Hummus'] },
        { day: 'Friday', items: ['Protein Pancakes', 'Poke Bowl', 'Chicken Salad'] },
        { day: 'Saturday', items: ['Acai Bowl', 'Buddha Bowl', 'Salmon Fillet'] },
        { day: 'Sunday', items: ['Brunch Platter', 'Cheat Day Special', 'Dessert'] },
      ],
      photos: mealPhotos.slice(1, 4),
      kitchenPhotos: mealPhotos.slice(0, 2),
      location: { type: 'Point', coordinates: [77.6380, 12.9116] },
      featured: true,
      verified: true,
      averageRating: 4.7,
      reviewCount: 63,
      contactPhone: '9876543210',
      minPrice: 3800,
    },
  ]);

  console.log(`
✅ Database seeded successfully!
──────────────────────────────────
Test Accounts:
  Admin:    admin@homiebites.com / password123
  Provider: rahul@homiebites.com / password123
  User:     user@homiebites.com  / password123
──────────────────────────────────
Created:
  4 Provider accounts
  8 PG Listings
  5 Meal Services
  `);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

