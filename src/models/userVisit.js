import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const UserVisit = sequelize.define(
  'UserVisit',
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
    visitedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'visited_at',
    },
  },
  {
    tableName: 'user_visits',
    timestamps: false,
  }
);
