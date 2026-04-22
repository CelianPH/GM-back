import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Level = sequelize.define(
  'Level',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rank: {
      type: DataTypes.ENUM(
        'commis',
        'chef_de_partie',
        'sous_chef',
        'chef',
        'chef_etoile'
      ),
      allowNull: false,
      unique: true,
    },
    tierName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'tier_name',
    },
    minExperiences: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'min_experiences',
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'levels',
  }
);
