import { ZodError } from 'zod';
import {
  registerSchema,
  loginSchema,
  oauthGoogleSchema,
  oauthAppleSchema,
} from '../validators/auth.js';
import {
  AuthError,
  registerWithEmail,
  loginWithEmail,
  findOrCreateOAuthUser,
} from '../services/auth.service.js';
import { verifyGoogleIdToken } from '../utils/oauth/google.js';
import { verifyAppleIdToken } from '../utils/oauth/apple.js';
import { env } from '../config/env.js';

function handleError(err, res) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION',
        message: 'Données invalides.',
        details: err.flatten().fieldErrors,
      },
    });
  }
  if (err instanceof AuthError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }
  console.error('[auth controller] erreur inattendue :', err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Erreur serveur.' },
  });
}

export async function register(req, res) {
  try {
    const input = registerSchema.parse(req.body);
    const { user, token } = await registerWithEmail(input);
    return res.status(201).json({ user, token });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function login(req, res) {
  try {
    const input = loginSchema.parse(req.body);
    const { user, token } = await loginWithEmail(input);
    return res.status(200).json({ user, token });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function oauthGoogle(req, res) {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AuthError('OAUTH_DISABLED', 'Google OAuth non configuré côté serveur.', 501);
    }
    const { idToken } = oauthGoogleSchema.parse(req.body);
    const profile = await verifyGoogleIdToken(idToken);
    const result = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: profile.googleId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
    });
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function oauthApple(req, res) {
  try {
    if (!env.APPLE_ENABLED) {
      throw new AuthError('OAUTH_DISABLED', 'Apple OAuth non activé côté serveur.', 501);
    }
    const { idToken, firstName, lastName } = oauthAppleSchema.parse(req.body);
    const profile = await verifyAppleIdToken(idToken);
    const result = await findOrCreateOAuthUser({
      provider: 'apple',
      providerId: profile.appleId,
      email: profile.email,
      firstName,
      lastName,
    });
    return res.status(200).json(result);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function me(req, res) {
  return res.status(200).json({ user: req.user.toJSON() });
}
