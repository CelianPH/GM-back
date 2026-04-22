import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name',
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name',
    },
    role: {
      type: DataTypes.ENUM('client', 'pro', 'admin'),
      allowNull: false,
      defaultValue: 'client',
    },
    friendCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'friend_code',
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'avatar_url',
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'google_id',
    },
    appleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'apple_id',
    },
  },
  {
    tableName: 'users',
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: { attributes: { include: ['password'] } },
    },
  }
);
