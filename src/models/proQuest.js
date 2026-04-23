import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const ProQuest = sequelize.define(
  'ProQuest',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    establishmentId: { type: DataTypes.INTEGER, allowNull: false, field: 'establishment_id' },
    status: {
      type: DataTypes.ENUM('active', 'draft', 'done'),
      allowNull: false,
      defaultValue: 'draft',
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    startsAt: { type: DataTypes.DATE, allowNull: true, field: 'starts_at' },
    endsAt: { type: DataTypes.DATE, allowNull: true, field: 'ends_at' },
    rewardPoints: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'reward_points' },
    rewardVideoId: { type: DataTypes.INTEGER, allowNull: true, field: 'reward_video_id' },
    goalCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, field: 'goal_count' },
    doneCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'done_count' },
  },
  { tableName: 'pro_quests', timestamps: true, underscored: true }
);
