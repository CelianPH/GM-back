import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../../config/env.js';
import { AuthError } from '../../services/auth.service.js';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URI = 'https://appleid.apple.com/auth/keys';

const jwks = jwksClient({
  jwksUri: APPLE_JWKS_URI,
  cache: true,
  cacheMaxAge: 24 * 60 * 60 * 1000,
  rateLimit: true,
});

function getKey(header, cb) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return cb(err);
    cb(null, key.getPublicKey());
  });
}

export function verifyAppleIdToken(idToken) {
  if (!env.APPLE_ENABLED) {
    return Promise.reject(new AuthError('OAUTH_DISABLED', 'Apple OAuth désactivé.', 501));
  }
  if (!env.APPLE_SERVICES_ID) {
    return Promise.reject(new AuthError('OAUTH_DISABLED', 'APPLE_SERVICES_ID manquant.', 501));
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        issuer: APPLE_ISSUER,
        audience: env.APPLE_SERVICES_ID,
        algorithms: ['RS256'],
      },
      (err, decoded) => {
        if (err) {
          return reject(new AuthError('OAUTH_INVALID_TOKEN', 'Token Apple invalide.', 401));
        }
        if (!decoded || !decoded.sub) {
          return reject(new AuthError('OAUTH_INVALID_TOKEN', 'Payload Apple invalide.', 401));
        }
        resolve({
          appleId: decoded.sub,
          email: decoded.email || null,
          emailVerified: decoded.email_verified === true || decoded.email_verified === 'true',
        });
      }
    );
  });
}
