// Edge-compatible cookie verification using Web Crypto API

const SECRET = process.env.COOKIE_SECRET || 'fallback-dev-secret-change-in-prod';

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function verifyCookieEdge(signedValue: string): Promise<string | null> {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;

  const [value, signature] = parts;
  const key = await getKey();
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  const expectedSignature = base64urlEncode(signatureBuffer);

  if (signature !== expectedSignature) return null;
  return value;
}
