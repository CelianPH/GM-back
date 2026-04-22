import crypto from 'node:crypto';
import { User } from '../models/user.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LEN = 6;
const MAX_ATTEMPTS = 10;

function randomCode() {
  const bytes = crypto.randomBytes(CODE_LEN);
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `GM-${out}`;
}

export async function generateUniqueFriendCode() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = randomCode();
    const existing = await User.findOne({ where: { friendCode: code } });
    if (!existing) return code;
  }
  throw new Error('Impossible de générer un friend_code unique après plusieurs tentatives');
}
