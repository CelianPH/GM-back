import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Title = sequelize.define(
  'Title',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tagline: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    themeHint: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'theme_hint',
    },
  },
  {
    tableName: 'titles',
  }
);
