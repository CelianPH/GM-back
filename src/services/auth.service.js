import bcrypt from 'bcrypt';
import { sequelize, User, Level, Pass } from '../models/index.js';
import { generateUniqueFriendCode } from '../utils/friendCode.js';
import { generateUniquePassNumber } from '../utils/passNumber.js';
import { signJwt } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

function deriveFirstNameFromEmail(email) {
  const local = (email.split('@')[0] || '').replace(/\./g, ' ');
  const parts = local.split(' ').filter(Boolean);
  if (parts.length === 0) return 'Gourmand';
  const first = parts[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function tokenFor(user) {
  return signJwt({ sub: user.id, email: user.email });
}

function publicUser(user) {
  const json = user.toJSON();
  delete json.password;
  return json;
}

async function createPassForUser(userId, transaction) {
  const level = await Level.findOne({ where: { rank: 'commis' }, transaction });
  if (!level) {
    throw new Error('Niveau "commis" introuvable. As-tu lancé npm run db:seed ?');
  }
  const passNumber = await generateUniquePassNumber();
  return Pass.create(
    {
      userId,
      levelId: level.id,
      passNumber,
    },
    { transaction }
  );
}

export class AuthError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function registerWithEmail({ email, password, firstName, lastName }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new AuthError('EMAIL_TAKEN', 'Cet email est déjà utilisé.', 409);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const friendCode = await generateUniqueFriendCode();

  const resolvedFirstName = firstName || deriveFirstNameFromEmail(email);
  const resolvedLastName = lastName || '—';

  const result = await sequelize.transaction(async (transaction) => {
    const user = await User.create(
      {
        email,
        password: hashed,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        friendCode,
      },
      { transaction }
    );
    await createPassForUser(user.id, transaction);
    return user;
  });

  const fresh = await User.findByPk(result.id);
  return { user: publicUser(fresh), token: tokenFor(fresh) };
}

export async function loginWithEmail({ email, password }) {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) {
    throw new AuthError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.', 401);
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new AuthError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect.', 401);
  }
  return { user: publicUser(user), token: tokenFor(user) };
}

export async function findOrCreateOAuthUser({ provider, providerId, email, firstName, lastName }) {
  const providerField = provider === 'google' ? 'googleId' : 'appleId';

  let user = await User.findOne({ where: { [providerField]: providerId } });
  let isNew = false;

  if (!user && email) {
    user = await User.findOne({ where: { email } });
    if (user) {
      user[providerField] = providerId;
      await user.save();
    }
  }

  if (!user) {
    const randomPwd = await bcrypt.hash(`${provider}-${providerId}-${Date.now()}`, SALT_ROUNDS);
    const friendCode = await generateUniqueFriendCode();
    const resolvedFirstName = firstName || deriveFirstNameFromEmail(email || `${provider}-user`);
    const resolvedLastName = lastName || '—';

    const created = await sequelize.transaction(async (transaction) => {
      const u = await User.create(
        {
          email: email || `${provider}-${providerId}@oauth.local`,
          password: randomPwd,
          firstName: resolvedFirstName,
          lastName: resolvedLastName,
          friendCode,
          [providerField]: providerId,
        },
        { transaction }
      );
      await createPassForUser(u.id, transaction);
      return u;
    });

    user = await User.findByPk(created.id);
    isNew = true;
  }

  return { user: publicUser(user), token: tokenFor(user), isNew };
}
