import { Sequelize } from 'sequelize';
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_POOL_ACQUIRE_MS,
  DB_POOL_IDLE_MS,
  DB_POOL_MAX,
  DB_POOL_MIN,
  DB_PORT,
  DB_USER,
} from '../config.js';

if (!DB_PASSWORD) {
  throw new Error(
    'DB_PASSWORD is required. Set it in the environment or local .env file.'
  );
}

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  dialect: 'postgres',
  host: DB_HOST,
  port: DB_PORT,
  pool: {
    max: DB_POOL_MAX,
    min: DB_POOL_MIN,
    acquire: DB_POOL_ACQUIRE_MS,
    idle: DB_POOL_IDLE_MS,
  },
  logging: false,
});
