import { sequelize } from '../db.js';
import { User } from './user.js';
import { Level } from './level.js';
import { Pass } from './pass.js';
import { Title } from './title.js';
import { UserTaste } from './userTaste.js';
import { Establishment } from './establishment.js';
import { UserVisit } from './userVisit.js';

User.hasOne(Pass, { foreignKey: 'userId', as: 'pass', onDelete: 'CASCADE' });
Pass.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Level.hasMany(Pass, { foreignKey: 'levelId', as: 'passes' });
Pass.belongsTo(Level, { foreignKey: 'levelId', as: 'level' });

Title.hasMany(Pass, { foreignKey: 'titleId', as: 'passes' });
Pass.belongsTo(Title, { foreignKey: 'titleId', as: 'title' });

User.hasMany(UserTaste, { foreignKey: 'userId', as: 'tastes', onDelete: 'CASCADE' });
UserTaste.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserVisit, { foreignKey: 'userId', as: 'visits', onDelete: 'CASCADE' });
UserVisit.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Establishment.hasMany(UserVisit, { foreignKey: 'establishmentId', as: 'visits' });
UserVisit.belongsTo(Establishment, { foreignKey: 'establishmentId', as: 'establishment' });

export { sequelize, User, Level, Pass, Title, UserTaste, Establishment, UserVisit };
