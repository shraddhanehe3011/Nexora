const mongoose = require('mongoose');
const config = require('./index');

async function connectDatabase() {
  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(config.mongodbUri, {
    dbName: 'nexora',
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  mongoose.connection.on('disconnected', () => {
    console.error('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err.message);
  });

  return mongoose.connection;
}

module.exports = { connectDatabase };
