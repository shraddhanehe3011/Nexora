const app = require('./app');
const config = require('./config');
const { connectDatabase } = require('./config/db');

async function start() {
  try {
    await connectDatabase();
    console.log('Connected to MongoDB (nexora)');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
    console.warn('Starting without MongoDB — set MONGODB_URI in .env');
  }

  app.listen(config.port, () => {
    console.log(`NEXORA API listening on port ${config.port}`);
  });
}

start();
