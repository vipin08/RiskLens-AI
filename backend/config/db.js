const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables.');
    }
    
    if (uri.startsWith('${{')) {
      throw new Error(`MONGODB_URI is set to "${uri}"`);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`
    MongoDB Connection Failed!
    Reason: ${error.message}
    `);
    process.exit(1);
  }
};

module.exports = connectDB;
