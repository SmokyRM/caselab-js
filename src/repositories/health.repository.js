import { QueryTypes } from 'sequelize';
import { sequelize } from '../db/models/index.js';

export async function checkDatabase() {
  await sequelize.query('SELECT 1', { type: QueryTypes.SELECT });
}
