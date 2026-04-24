import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Establishment = sequelize.define(
  'Establishment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: { type: DataTypes.STRING(255), allowNull: false },
    type: {
      type: DataTypes.ENUM('restaurant', 'lodging'),
      allowNull: false,
      defaultValue: 'restaurant',
    },
    city: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    postal_code: { type: DataTypes.STRING(10), allowNull: false, defaultValue: '' },
    address: { type: DataTypes.STRING(255), allowNull: false, defaultValue: '' },
    lat: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    lng: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    phone: { type: DataTypes.STRING(255), allowNull: true },
    website: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    cover_image_url: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    qrToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
      field: 'qr_token',
    },
  },
  {
    tableName: 'establishments',
    timestamps: false,
  }
);
