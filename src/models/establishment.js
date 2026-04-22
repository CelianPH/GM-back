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
    type: {
      type: DataTypes.ENUM('restaurant', 'hotel'),
      allowNull: false,
      defaultValue: 'restaurant',
    },

  },
  {
    tableName: 'establishments',
    timestamps: false,
  }
);
