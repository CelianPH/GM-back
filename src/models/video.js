import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Video = sequelize.define(
  'Video',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    establishmentId: { type: DataTypes.INTEGER, allowNull: false, field: 'establishment_id' },
    title: { type: DataTypes.STRING, allowNull: false },
    audience: {
      type: DataTypes.ENUM('all', 'firstvisit', 'archetype'),
      allowNull: false,
      defaultValue: 'all',
    },
    archetypeIds: { type: DataTypes.JSON, allowNull: true, field: 'archetype_ids' },
    status: {
      type: DataTypes.ENUM('active', 'paused'),
      allowNull: false,
      defaultValue: 'active',
    },
    durationSec: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_sec' },
    thumbUrl: { type: DataTypes.STRING, allowNull: true, field: 'thumb_url' },
    mediaUrl: { type: DataTypes.STRING, allowNull: false, field: 'media_url' },
  },
  { tableName: 'videos', timestamps: true, underscored: true }
);
