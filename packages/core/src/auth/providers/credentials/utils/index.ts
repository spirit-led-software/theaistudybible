import { argon2Verify, argon2id } from 'hash-wasm';

export async function hashPassword(password: string) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return await argon2id({
    password,
    salt,
    iterations: 1,
    parallelism: 1,
    memorySize: 16,
    hashLength: 32,
  });
}

export async function verifyPassword(hash: string, password: string) {
  return await argon2Verify({ hash, password });
}
