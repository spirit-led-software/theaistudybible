import { webcrypto } from 'node:crypto';
import { argon2Verify, argon2id } from 'hash-wasm';

export async function hashPassword(password: string) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  return await argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 256,
    memorySize: 512,
    hashLength: 32,
    outputType: 'encoded',
  });
}

export async function verifyPassword(hash: string, password: string) {
  return await argon2Verify({ password, hash });
}
