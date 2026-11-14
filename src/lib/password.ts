import crypto from 'node:crypto';

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384; // N = 2^14
const SCRYPT_BLOCK_SIZE = 8; // r = 8
const SCRYPT_PARALLELISM = 1; // p = 1

/**
 * Hashes a plaintext password using scrypt with a unique random 16-byte salt.
 * Compatible across all Node.js LTS environments (18, 20, 22, 24, 26) and serverless runtimes.
 */
export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELISM,
  });
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

/**
 * Verifies an input password against a stored password hash.
 * Supports transitional migration from legacy plaintext entries safely without breaking access.
 */
export function verifyPassword(
  plainPassword: string,
  storedValue: string
): { valid: boolean; needsRehash: boolean } {
  if (!plainPassword || !storedValue) {
    return { valid: false, needsRehash: false };
  }

  if (storedValue.startsWith('scrypt$')) {
    const parts = storedValue.split('$');
    if (parts.length !== 3) {
      return { valid: false, needsRehash: false };
    }
    const [, salt, storedHashHex] = parts;
    if (!salt || !storedHashHex) {
      return { valid: false, needsRehash: false };
    }

    try {
      const derived = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN, {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELISM,
      });
      const storedBuffer = Buffer.from(storedHashHex, 'hex');
      if (derived.length !== storedBuffer.length) {
        return { valid: false, needsRehash: false };
      }
      const valid = crypto.timingSafeEqual(derived, storedBuffer);
      return { valid, needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Legacy plaintext transitional verification using constant-time comparison
  const inputBuf = Buffer.from(plainPassword, 'utf8');
  const storedBuf = Buffer.from(storedValue, 'utf8');
  if (inputBuf.length !== storedBuf.length) {
    return { valid: false, needsRehash: false };
  }
  const valid = crypto.timingSafeEqual(inputBuf, storedBuf);
  return { valid, needsRehash: valid };
}
