import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const UserTaste = sequelize.define(
  'UserTaste',
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'user_id',
    },
    category: {
      type: DataTypes.ENUM('envies', 'moments', 'valeurs'),
      allowNull: false,
      primaryKey: true,
    },
    tag: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: 'user_tastes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);
