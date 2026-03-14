const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
require('dotenv').config();

// Connect to MongoDB
connectDB();

// Load the User model
const User = require('./models/users');

// Read and parse marketmind.jsonl
const data = fs.readFileSync('./marketmind.jsonl', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map(line => JSON.parse(line));

// Extract unique brands using a Set
const brands = new Set();
data.forEach(record => {
  record.product_options.forEach(product => {
    brands.add(product.brand);
  });
});

// Generate user data for each brand
const users = Array.from(brands).map(brand => ({
  email: `${brand.toLowerCase()}@marketmind.com`,
  password: bcrypt.hashSync('BrandPass123', 10),
  role: 'company'
}));

// Insert users into MongoDB
User.insertMany(users)
  .then(() => console.log(`Imported ${users.length} users successfully`))
  .catch(err => console.error('Error importing users:', err))
  .finally(() => mongoose.connection.close());