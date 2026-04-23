import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const EstablishmentManager = sequelize.define(
  'EstablishmentManager',
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'user_id',
    },
    establishmentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'establishment_id',
    },
    role: {
      type: DataTypes.ENUM('owner', 'manager', 'staff'),
      allowNull: false,
      defaultValue: 'manager',
    },
  },
  { tableName: 'establishment_managers', timestamps: true, underscored: true }
);
