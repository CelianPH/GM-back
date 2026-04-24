// GM-back/src/services/friend.service.js
import { sequelize, User } from '../models/index.js';
import { QueryTypes } from 'sequelize';

export class FriendError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function addFriend(userId, friendCode) {
  const friend = await User.findOne({ where: { friendCode } });
  if (!friend) throw new FriendError('NOT_FOUND', 'Code ami introuvable.', 404);
  if (friend.id === userId) throw new FriendError('SELF_ADD', 'Tu ne peux pas t\'ajouter toi-même.');

  const [existing] = await sequelize.query(
    `SELECT id FROM friendships
     WHERE (user_id = :userId AND friend_id = :friendId)
        OR (user_id = :friendId AND friend_id = :userId)`,
    { replacements: { userId, friendId: friend.id }, type: QueryTypes.SELECT }
  );
  if (existing) throw new FriendError('ALREADY_FRIEND', 'Déjà dans ta liste d\'amis.', 409);

  const now = new Date();
  await sequelize.query(
    `INSERT INTO friendships (user_id, friend_id, status, initiated_at, accepted_at, created_at, updated_at)
     VALUES (:userId, :friendId, 'accepted', :now, :now, :now, :now)`,
    { replacements: { userId, friendId: friend.id, now }, type: QueryTypes.INSERT }
  );

  return { id: friend.id, firstName: friend.firstName, lastName: friend.lastName, friendCode: friend.friendCode };
}

export async function getFriends(userId) {
  return sequelize.query(
    `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.friend_code AS friendCode
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.user_id = :userId THEN f.friend_id ELSE f.user_id END
     WHERE (f.user_id = :userId OR f.friend_id = :userId) AND f.status = 'accepted'
     ORDER BY f.accepted_at DESC`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
}

export async function getFriendPass(userId, friendId) {
  const [friendship] = await sequelize.query(
    `SELECT id FROM friendships
     WHERE ((user_id = :userId AND friend_id = :friendId) OR (user_id = :friendId AND friend_id = :userId))
       AND status = 'accepted'`,
    { replacements: { userId, friendId }, type: QueryTypes.SELECT }
  );
  if (!friendship) throw new FriendError('NOT_A_FRIEND', 'Cet utilisateur n\'est pas dans ta liste.', 403);

  const friend = await User.findByPk(friendId);
  if (!friend) throw new FriendError('NOT_FOUND', 'Utilisateur introuvable.', 404);

  const [passRow] = await sequelize.query(
    `SELECT p.experiences_count, p.member_since, p.search_city,
            l.tier_name AS levelTier, l.rank AS levelRank,
            t.slug AS titleSlug, t.name AS titleName
     FROM passes p
     LEFT JOIN levels l ON l.id = p.level_id
     LEFT JOIN titles t ON t.id = p.title_id
     WHERE p.user_id = :friendId`,
    { replacements: { friendId }, type: QueryTypes.SELECT }
  );
  if (!passRow) throw new FriendError('NO_PASS', 'Cet ami n\'a pas encore de Pass.', 404);

  const [counts] = await sequelize.query(
    `SELECT
      SUM(e.type = 'restaurant')   AS restaurantsCount,
      SUM(e.type = 'lodging')      AS hotelsCount,
      COUNT(DISTINCT e.region_id)  AS regionsCount,
      SUM(rd.distinction = 'three_stars') AS threeStarsCount
     FROM user_visits uv
     JOIN establishments e ON e.id = uv.establishment_id
     LEFT JOIN restaurant_details rd ON rd.establishment_id = e.id
     WHERE uv.user_id = :friendId`,
    { replacements: { friendId }, type: QueryTypes.SELECT }
  );

  const [badgeCount] = await sequelize.query(
    'SELECT COUNT(*) AS total FROM user_badges WHERE user_id = :friendId',
    { replacements: { friendId }, type: QueryTypes.SELECT }
  );

  const LEVEL_THRESHOLDS = [0, 5, 15, 35, 75];
  const SCALE_INDEX = { commis: 0, chef_de_partie: 1, sous_chef: 2, chef: 3, chef_etoile: 4 };
  const experiences = Number(passRow.experiences_count) || 0;
  const scaleIdx = SCALE_INDEX[passRow.levelRank] ?? 0;
  const tierWidth = 25;
  const currentMin = LEVEL_THRESHOLDS[scaleIdx] ?? 0;
  const nextMin = LEVEL_THRESHOLDS[scaleIdx + 1];
  const withinTier = nextMin !== undefined ? (experiences - currentMin) / (nextMin - currentMin) : 1;
  const levelFill = Math.min(100, scaleIdx * tierWidth + withinTier * tierWidth);
  const nextCount = nextMin !== undefined ? Math.max(0, nextMin - experiences) : 0;

  const memberSince = (() => {
    if (!passRow.member_since) return '';
    const d = new Date(passRow.member_since);
    if (isNaN(d.getTime())) return '';
    return `MEMBRE DEPUIS ${new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(d).replace(/\./g, '').trim().toUpperCase()}`;
  })();

  const ARCHETYPE_TITLES = {
    curieux: 'Le Curieux', esthete: "L'Esthète", collectionneur: 'Le Collectionneur',
    local: 'Le Local', nomade: 'Le Nomade', epicurien: "L'Épicurien",
  };

  return {
    cardName: `${friend.firstName} ${friend.lastName}`,
    archLabel: ARCHETYPE_TITLES[passRow.titleSlug] ?? passRow.titleName ?? '',
    tier: `NIVEAU · ${(passRow.levelTier ?? 'Commis').toUpperCase()}`,
    memberSince,
    levelName: passRow.levelTier ?? 'Commis',
    levelFill,
    scaleIndex: scaleIdx,
    stats: {
      exp: String(experiences),
      reg: String(Number(counts.regionsCount) || 0),
      bad: String(Number(badgeCount.total) || 0),
      next: String(nextCount),
      tables: String(Number(counts.restaurantsCount) || 0).padStart(2, '0'),
      nights: String(Number(counts.hotelsCount) || 0).padStart(2, '0'),
      expEmpty: experiences === 0,
      regEmpty: Number(counts.regionsCount) === 0,
      badEmpty: Number(badgeCount.total) === 0,
    },
  };
}
