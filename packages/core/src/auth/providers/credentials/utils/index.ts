import { argon2id } from '../lib/argon2';

export async function hashPassword(password: string) {
  const hash = await argon2id.hash(password);
  return hash;
}

export async function verifyPassword(hash: string, password: string) {
  return await argon2id.verify(hash, password);
}
