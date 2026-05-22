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

  const { password } = await request.json();
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || password !== sitePassword) {
    return NextResponse.json(
      { error: `Wrong password. ${rateCheck.remaining} attempts remaining.` },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('site-auth', signCookie('authenticated'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}
