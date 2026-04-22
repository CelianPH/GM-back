import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env.js';
import { AuthError } from '../../services/auth.service.js';

let client;

function getClient() {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AuthError('OAUTH_DISABLED', 'GOOGLE_CLIENT_ID manquant.', 501);
  }
  if (!client) {
    client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return client;
}

export async function verifyGoogleIdToken(idToken) {
  const ticket = await getClient()
    .verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID })
    .catch(() => null);

  if (!ticket) {
    throw new AuthError('OAUTH_INVALID_TOKEN', 'Token Google invalide.', 401);
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.sub) {
    throw new AuthError('OAUTH_INVALID_TOKEN', 'Payload Google invalide.', 401);
  }

  if (payload.email && payload.email_verified === false) {
    throw new AuthError('OAUTH_EMAIL_NOT_VERIFIED', 'Email Google non vérifié.', 401);
  }

  return {
    googleId: payload.sub,
    email: payload.email || null,
    firstName: payload.given_name || null,
    lastName: payload.family_name || null,
  };
}
