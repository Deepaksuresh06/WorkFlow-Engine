require('dotenv').config();
const app       = require('./app');
const connectDB = require('./config/db');
const logger    = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });

  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    server.close(async () => {
      await require('mongoose').connection.close();
      process.exit(0);
    });
  });
};

start();
