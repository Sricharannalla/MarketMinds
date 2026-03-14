const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/products');
const User = require('./models/users');
require('dotenv').config();

// Connect to MongoDB
connectDB();

// Read and parse marketmind.jsonl
const data = fs.readFileSync('./marketmind.jsonl', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map(line => JSON.parse(line));

// Extract unique products
const products = Array.from(
  new Map(
    data.flatMap(record => record.product_options)
      .map(p => [p.product_id, p])
  ).values()
);

// Map brands to user _ids
async function importProducts() {
  try {
    // Fetch all users to map brands to their _ids
    const users = await User.find({}).select('email _id');
    const brandToUserId = new Map(
      users.map(user => {
        const brand = user.email.split('@')[0].toLowerCase();
        return [brand, user._id];
      })
    );

    // Add isStaged and companyId to each product
    const productsWithCompanyId = products.map(product => {
      const brand = product.brand.toLowerCase();
      const companyId = brandToUserId.get(brand);
      if (!companyId) {
        console.warn(`No user found for brand: ${product.brand}`);
        return null; // Skip products with no matching user
      }
      return {
        ...product,
        isStaged: false,
        companyId
      };
    }).filter(p => p !== null); // Remove null entries

    // Insert products into MongoDB
    await Product.insertMany(productsWithCompanyId);
    console.log(`Imported ${productsWithCompanyId.length} products successfully`);
  } catch (err) {
    console.error('Error importing products:', err);
  } finally {
    mongoose.connection.close();
  }
}

importProducts();