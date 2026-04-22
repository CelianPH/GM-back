import { sequelize } from '../db.js';
import { User } from './user.js';
import { Level } from './level.js';
import { Pass } from './pass.js';

User.hasOne(Pass, { foreignKey: 'userId', as: 'pass', onDelete: 'CASCADE' });
Pass.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Level.hasMany(Pass, { foreignKey: 'levelId', as: 'passes' });
Pass.belongsTo(Level, { foreignKey: 'levelId', as: 'level' });

export { sequelize, User, Level, Pass };
