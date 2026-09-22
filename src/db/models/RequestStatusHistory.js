import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class RequestStatusHistory extends Model {}

RequestStatusHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: sequelize.literal('gen_random_uuid()'),
    },
    request_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    old_status: {
      type: DataTypes.ENUM('new', 'in_progress', 'done', 'rejected'),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.ENUM('new', 'in_progress', 'done', 'rejected'),
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'RequestStatusHistory',
    tableName: 'request_status_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);
