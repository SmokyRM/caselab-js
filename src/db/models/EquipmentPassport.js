import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class EquipmentPassport extends Model {}

EquipmentPassport.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: sequelize.literal('gen_random_uuid()'),
    },
    equipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rated_power: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    last_verification_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: 'EquipmentPassport',
    tableName: 'equipment_passports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
