import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class RequestAssignee extends Model {}

RequestAssignee.init(
  {
    request_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    technician_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('lead', 'member'),
      allowNull: false,
    },
    hours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'RequestAssignee',
    tableName: 'request_assignees',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
