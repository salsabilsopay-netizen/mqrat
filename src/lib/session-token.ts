/**
 * Edge & Node.js compatible cryptographic session token signing & verification.
 * Uses Web Crypto API (crypto.subtle) HMAC-SHA256 so Next.js Middleware (Edge)
 * and Route Handlers (Node.js) use identical verification without hardcoded secrets.
 */

export interface SessionTokenPayload {
  sid: string;
  uid: string;
  username: string;
  role: string;
  exp: number; // Unix timestamp in milliseconds
}

function getSecretKeyString(): string | null {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret || secret.trim().length < 16) {
    return null;
  }
  return secret.trim();
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array | null {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSessionToken(payload: SessionTokenPayload): Promise<string> {
  const secret = getSecretKeyString();
  if (!secret) {
    throw new Error('ADMIN_SECRET_KEY environment variable is not properly configured.');
  }

  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const payloadB64 = toBase64Url(payloadBytes);

  const key = await importHmacKey(secret);
  const sigBuffer = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sigBuffer));

  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionTokenPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const secret = getSecretKeyString();
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  const sigBytes = fromBase64Url(sigB64);
  if (!sigBytes) return null;

  try {
    const encoder = new TextEncoder();
    const key = await importHmacKey(secret);
    const isValid = await globalThis.crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes.buffer as ArrayBuffer,
      encoder.encode(payloadB64)
    );
    if (!isValid) return null;

    const payloadBytes = fromBase64Url(payloadB64);
    if (!payloadBytes) return null;

    const decoded = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(decoded) as SessionTokenPayload;

    if (
      !payload ||
      typeof payload.sid !== 'string' ||
      typeof payload.uid !== 'string' ||
      typeof payload.username !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    if (Date.now() >= payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
