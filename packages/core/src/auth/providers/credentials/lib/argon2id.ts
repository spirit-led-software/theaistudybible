import { argon2id } from '@noble/hashes/argon2';

export class Argon2id {
  hash(password: string, salt: string) {
    const hash = argon2id(password, salt, {
      m: 19456,
      t: 2,
      p: 1,
    });
    return Buffer.from(hash).toString('hex');
  }

  verify(password: string, salt: string, hash: string) {
    const compare = this.hash(password, salt);
    return compare === hash;
  }
}
