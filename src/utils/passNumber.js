import crypto from 'node:crypto';
import { Pass } from '../models/pass.js';

const DIGITS = '0123456789';
const LEN = 6;
const MAX_ATTEMPTS = 10;

function randomNumber() {
  const bytes = crypto.randomBytes(LEN);
  let out = '';
  for (let i = 0; i < LEN; i++) {
    out += DIGITS[bytes[i] % DIGITS.length];
  }
  return `GM-FR-${out}`;
}

export async function generateUniquePassNumber() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const num = randomNumber();
    const existing = await Pass.findOne({ where: { passNumber: num } });
    if (!existing) return num;
  }
  throw new Error('Impossible de générer un pass_number unique après plusieurs tentatives');
}
