import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const LodgingDetail = sequelize.define(
  'LodgingDetail',
  {
    establishmentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: 'establishment_id',
    },
    keysLevel: { type: DataTypes.TINYINT, allowNull: false, field: 'keys_level' },
    lodgingType: {
      type: DataTypes.ENUM('hotel', 'maison_hotes', 'gite', 'lodge', 'autre'),
      allowNull: false,
      field: 'lodging_type',
    },
    roomsCount: { type: DataTypes.INTEGER, allowNull: true, field: 'rooms_count' },
    amenities: { type: DataTypes.JSON, allowNull: true },
  },
  { tableName: 'lodging_details', timestamps: true, underscored: true }
);
