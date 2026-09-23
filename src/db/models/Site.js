import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Site extends Model {}

Site.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: sequelize.literal('gen_random_uuid()'),
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lat: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    lon: {
      type: DataTypes.DECIMAL(9, 6),
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
    modelName: 'Site',
    tableName: 'sites',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
