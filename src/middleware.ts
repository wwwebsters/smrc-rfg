import { NextRequest, NextResponse } from 'next/server';
import { verifyCookieEdge } from '@/lib/cookie-verify-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page and auth APIs through (no auth required)
  if (
    pathname === '/rfg/login' ||
    pathname === '/api/auth' ||
    pathname === '/api/admin/auth'
  ) {
    return NextResponse.next();
  }

  // Protect landing page, /rfg, /attendance and /api routes with site auth
  if (pathname === '/' || pathname.startsWith('/rfg') || pathname.startsWith('/attendance') || pathname.startsWith('/api')) {
    // Check for site auth cookie with signature verification
    const authCookie = request.cookies.get('site-auth');
    const verifiedValue = authCookie?.value ? await verifyCookieEdge(authCookie.value) : null;
    if (verifiedValue !== 'authenticated') {
      return NextResponse.redirect(new URL('/rfg/login', request.url));
    }
  } else {
    return NextResponse.next();
  }

  // Admin pages and admin APIs require additional admin auth
  // Different admin areas have separate passwords
  const isAttendanceAdmin = pathname.startsWith('/attendance/admin');
  const isRfgAdmin = pathname.startsWith('/rfg/admin');
  const isAttendanceAdminApi = pathname.startsWith('/api/attendance/rsvp-queue') || pathname.startsWith('/api/attendance/weeks') || pathname.startsWith('/api/attendance/auth-check');
  const isRfgAdminApi = (pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth') || pathname.startsWith('/api/rfg/auth-check');

  // Attendance admin pages and APIs (only /attendance/admin, not all attendance pages)
  if (isAttendanceAdmin || isAttendanceAdminApi) {
    const adminCookie = request.cookies.get('admin-auth-attendance');
    const verifiedAdmin = adminCookie?.value ? await verifyCookieEdge(adminCookie.value) : null;
    if (verifiedAdmin !== 'authenticated') {
      if (isAttendanceAdminApi) {
        return new NextResponse(JSON.stringify({ error: 'Attendance admin authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // For admin pages, let through — the layout handles the login prompt
      return NextResponse.next();
    }
  }

  // RFG admin pages and APIs
  if (isRfgAdmin || isRfgAdminApi) {
    const adminCookie = request.cookies.get('admin-auth-rfg');
    const verifiedRfgAdmin = adminCookie?.value ? await verifyCookieEdge(adminCookie.value) : null;
    if (verifiedRfgAdmin !== 'authenticated') {
      if (isRfgAdminApi) {
        return new NextResponse(JSON.stringify({ error: 'RFG admin authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // For admin pages, let through — the layout handles the login prompt
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
