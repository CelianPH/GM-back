import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Pass = sequelize.define(
  'Pass',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    passNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'pass_number',
    },
    levelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'level_id',
    },
    titleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'title_id',
    },
    featuredQuestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'featured_quest_id',
    },
    experiencesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'experiences_count',
    },
    pointsTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'points_total',
    },
    memberSince: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'member_since',
    },
    searchCity: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'search_city',
    },
    searchRadiusKm: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'search_radius_km',
    },
  },
  {
    tableName: 'passes',
  }
);
