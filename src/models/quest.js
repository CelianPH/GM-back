import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Quest = sequelize.define(
  'Quest',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    type: {
      type: DataTypes.ENUM('region', 'category', 'mixed', 'seasonal'),
      allowNull: false,
    },
    targetCount: { type: DataTypes.INTEGER, allowNull: false, field: 'target_count' },
    rewardPoints: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'reward_points' },
    rewardBadgeId: { type: DataTypes.INTEGER, allowNull: true, field: 'reward_badge_id' },
    startsAt: { type: DataTypes.DATE, allowNull: true, field: 'starts_at' },
    endsAt: { type: DataTypes.DATE, allowNull: true, field: 'ends_at' },
  },
  { tableName: 'quests', timestamps: true, underscored: true }
);
