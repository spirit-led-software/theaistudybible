import { randomBytes } from '@noble/hashes/utils';
import { Argon2id } from '../lib';

export function generateSalt() {
  return Buffer.from(randomBytes(16)).toString('hex');
}

export function hashPassword(password: string, salt: string) {
  const argon2id = new Argon2id();
  return argon2id.hash(password, salt);
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const argon2id = new Argon2id();
  return argon2id.verify(password, salt, hash);
}
