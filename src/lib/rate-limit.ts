// Simple in-memory rate limiter
// Resets on server restart, which is fine for Vercel serverless

const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  // Clean up expired records occasionally
  if (Math.random() < 0.1) {
    for (const [key, val] of attempts) {
      if (val.resetAt < now) attempts.delete(key);
    }
  }

  if (!record || record.resetAt < now) {
    // First attempt or window expired
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetIn: WINDOW_MS };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now };
  }

  record.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count, resetIn: record.resetAt - now };
}

export function getClientIp(request: Request): string {
  // Vercel/Cloudflare headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}
