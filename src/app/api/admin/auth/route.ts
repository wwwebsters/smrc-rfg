import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}
