import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Story = sequelize.define(
  'Story',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    establishmentId: { type: DataTypes.INTEGER, allowNull: false, field: 'establishment_id' },
    authorId: { type: DataTypes.INTEGER, allowNull: false, field: 'author_id' },
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    mediaUrl: { type: DataTypes.STRING, allowNull: true, field: 'media_url' },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
      allowNull: false,
      defaultValue: 'pending',
    },
    moderationScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'moderation_score',
    },
    moderationNotes: { type: DataTypes.TEXT, allowNull: true, field: 'moderation_notes' },
    publishedAt: { type: DataTypes.DATE, allowNull: true, field: 'published_at' },
  },
  { tableName: 'stories', timestamps: true, underscored: true }
);
