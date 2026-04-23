import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const RestaurantDetail = sequelize.define(
  'RestaurantDetail',
  {
    establishmentId: { type: DataTypes.INTEGER, primaryKey: true, field: 'establishment_id' },
    distinction: {
      type: DataTypes.ENUM('none', 'bib_gourmand', 'one_star', 'two_stars', 'three_stars', 'green_star'),
      allowNull: false,
      defaultValue: 'none',
    },
    cuisineTypeId: { type: DataTypes.INTEGER, allowNull: true, field: 'cuisine_type_id' },
    priceRange: { type: DataTypes.TINYINT, allowNull: true, field: 'price_range' },
  },
  { tableName: 'restaurant_details', timestamps: true, underscored: true }
);
