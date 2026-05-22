import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { signCookie } from '@/lib/cookie-signing';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(ip);

  if (!rateCheck.allowed) {
    const minutes = Math.ceil(rateCheck.resetIn / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${minutes} minutes.` },
      { status: 429 }
    );
  }

  const { password, type } = await request.json();

  // Determine which password to check based on type
  let adminPassword: string | undefined;
  let cookieName: string;

  if (type === 'attendance') {
    adminPassword = process.env.ADMIN_PASSWORD_ATTENDANCE || process.env.ADMIN_PASSWORD;
    cookieName = 'admin-auth-attendance';
  } else if (type === 'rfg') {
    adminPassword = process.env.ADMIN_PASSWORD_RFG || process.env.ADMIN_PASSWORD;
    cookieName = 'admin-auth-rfg';
  } else {
    // Fallback for backward compatibility
    adminPassword = process.env.ADMIN_PASSWORD;
    cookieName = 'admin-auth';
  }

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json(
      { error: `Wrong password. ${rateCheck.remaining} attempts remaining.` },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, signCookie('authenticated'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}
