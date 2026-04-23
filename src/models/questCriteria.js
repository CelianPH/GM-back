import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const QuestCriteria = sequelize.define(
  'QuestCriteria',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    questId: { type: DataTypes.INTEGER, allowNull: false, field: 'quest_id' },
    criterionType: {
      type: DataTypes.ENUM('region', 'distinction', 'establishment_type', 'cuisine_type', 'lodging_type'),
      allowNull: false,
      field: 'criterion_type',
    },
    criterionValue: { type: DataTypes.STRING, allowNull: false, field: 'criterion_value' },
  },
  { tableName: 'quest_criteria', timestamps: true, underscored: true }
);
