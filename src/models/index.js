import { sequelize } from '../db.js';
import { User } from './user.js';
import { Level } from './level.js';
import { Pass } from './pass.js';
import { Title } from './title.js';
import { UserTaste } from './userTaste.js';

User.hasOne(Pass, { foreignKey: 'userId', as: 'pass', onDelete: 'CASCADE' });
Pass.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Level.hasMany(Pass, { foreignKey: 'levelId', as: 'passes' });
Pass.belongsTo(Level, { foreignKey: 'levelId', as: 'level' });

Title.hasMany(Pass, { foreignKey: 'titleId', as: 'passes' });
Pass.belongsTo(Title, { foreignKey: 'titleId', as: 'title' });

User.hasMany(UserTaste, { foreignKey: 'userId', as: 'tastes', onDelete: 'CASCADE' });
UserTaste.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { sequelize, User, Level, Pass, Title, UserTaste };
