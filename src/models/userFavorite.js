import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const UserFavorite = sequelize.define(
  'UserFavorite',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    establishmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'establishment_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    tableName: 'user_favorites',
    timestamps: false,
  }
);
