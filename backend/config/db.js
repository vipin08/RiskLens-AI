require('dotenv').config({ path: __dirname + '/../.env' });
const jsondb = require('./jsondb');

const connectDB = async () => {
  try {
    jsondb.initDB();
    console.log('✓ JSON Database initialized (users.json)');
    return Promise.resolve();
  } catch (error) {
    console.error('Error initializing JSON database:', error);
    throw error;
  }
};

module.exports = connectDB;
