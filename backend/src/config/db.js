const mongoose = require('mongoose');
const config = require('./index');

async function connectDatabase() {
  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(config.mongodbUri, {
    dbName: 'nexora',
  });

  return mongoose.connection;
}

module.exports = { connectDatabase };
