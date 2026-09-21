import { logger } from '../logger.js';
import { DB_HOST, DB_PORT } from '../config.js';
import { sequelize } from './sequelize.js';

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connection established');
  } catch (error) {
    const errorMessage =
      error.message || error.original?.message || 'PostgreSQL is unavailable';

    logger.error(
      {
        host: DB_HOST,
        port: DB_PORT,
        errorName: error.name,
        errorMessage,
      },
      'Failed to connect to PostgreSQL'
    );
    throw error;
  }
}

export async function closeDatabase() {
  await sequelize.close();
  logger.info('PostgreSQL connection pool closed');
}
