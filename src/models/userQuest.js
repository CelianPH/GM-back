import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const UserQuest = sequelize.define(
  'UserQuest',
  {
    userId: { type: DataTypes.INTEGER, primaryKey: true, field: 'user_id' },
    questId: { type: DataTypes.INTEGER, primaryKey: true, field: 'quest_id' },
    progressCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'progress_count' },
    startedAt: { type: DataTypes.DATE, allowNull: false, field: 'started_at' },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
  },
  { tableName: 'user_quests', timestamps: true, underscored: true }
);
