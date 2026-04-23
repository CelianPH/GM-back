// GM-back/src/models/index.js
import { sequelize } from '../db.js';
import { User } from './user.js';
import { Level } from './level.js';
import { Pass } from './pass.js';
import { Title } from './title.js';
import { UserTaste } from './userTaste.js';
import { Establishment } from './establishment.js';
import { UserVisit } from './userVisit.js';
import { Quest } from './quest.js';
import { QuestCriteria } from './questCriteria.js';
import { UserQuest } from './userQuest.js';
import { RestaurantDetail } from './restaurantDetail.js';
import { LodgingDetail } from './lodgingDetail.js';
import { EstablishmentManager } from './establishmentManager.js';
import { Story } from './story.js';
import { Video } from './video.js';
import { ProQuest } from './proQuest.js';
import { UserFavorite } from './userFavorite.js';

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

Establishment.hasOne(RestaurantDetail, { foreignKey: 'establishmentId', as: 'restaurantDetail' });
RestaurantDetail.belongsTo(Establishment, { foreignKey: 'establishmentId', as: 'establishment' });

Establishment.hasOne(LodgingDetail, { foreignKey: 'establishmentId', as: 'lodgingDetail' });
LodgingDetail.belongsTo(Establishment, { foreignKey: 'establishmentId', as: 'establishment' });

User.belongsToMany(Establishment, {
  through: EstablishmentManager,
  foreignKey: 'userId',
  otherKey: 'establishmentId',
  as: 'managedEstablishments',
});
Establishment.belongsToMany(User, {
  through: EstablishmentManager,
  foreignKey: 'establishmentId',
  otherKey: 'userId',
  as: 'managers',
});

Establishment.hasMany(Story, { foreignKey: 'establishmentId', as: 'stories' });
Story.belongsTo(Establishment, { foreignKey: 'establishmentId', as: 'establishment' });
User.hasMany(Story, { foreignKey: 'authorId', as: 'authoredStories' });
Story.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Establishment.hasMany(Video, { foreignKey: 'establishmentId', as: 'videos' });
Video.belongsTo(Establishment, { foreignKey: 'establishmentId', as: 'establishment' });

Establishment.hasMany(ProQuest, { foreignKey: 'establishmentId', as: 'proQuests' });
ProQuest.belongsTo(Establishment, { foreignKey: 'establishmentId', as: 'establishment' });

Video.hasMany(ProQuest, { foreignKey: 'rewardVideoId', as: 'rewardingQuests' });
ProQuest.belongsTo(Video, { foreignKey: 'rewardVideoId', as: 'rewardVideo' });

Quest.hasMany(QuestCriteria, { foreignKey: 'questId', as: 'criteria' });
QuestCriteria.belongsTo(Quest, { foreignKey: 'questId', as: 'quest' });

User.hasMany(UserQuest, { foreignKey: 'userId', as: 'userQuests', onDelete: 'CASCADE' });
UserQuest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Quest.hasMany(UserQuest, { foreignKey: 'questId', as: 'userQuests' });
UserQuest.belongsTo(Quest, { foreignKey: 'questId', as: 'quest' });

User.hasMany(UserFavorite, { foreignKey: 'userId', as: 'favorites', onDelete: 'CASCADE' });
UserFavorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
  sequelize, User, Level, Pass, Title, UserTaste,
  Establishment, UserVisit, RestaurantDetail, LodgingDetail,
  EstablishmentManager, Story, Video, ProQuest,
  Quest, QuestCriteria, UserQuest, UserFavorite,
};
