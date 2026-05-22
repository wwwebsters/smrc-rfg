import { createHmac } from 'crypto';

const SECRET = process.env.COOKIE_SECRET || 'fallback-dev-secret-change-in-prod';

// Node.js version for API routes
export function signCookie(value: string): string {
  const signature = createHmac('sha256', SECRET)
    .update(value)
    .digest('base64url');
  return `${value}.${signature}`;
}

// Synchronous verification for Node.js API routes
export function verifyCookie(signedValue: string): string | null {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;

  const [value, signature] = parts;
  const expectedSignature = createHmac('sha256', SECRET)
    .update(value)
    .digest('base64url');

  if (signature !== expectedSignature) return null;
  return value;
}
