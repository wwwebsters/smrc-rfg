import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
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
    // Check for site auth cookie
    const authCookie = request.cookies.get('site-auth');
    if (authCookie?.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/rfg/login', request.url));
    }
  } else {
    return NextResponse.next();
  }

  // Admin pages and admin APIs require additional admin auth
  // Also require admin auth for main attendance pages while we work through issues
  const isAdminPage = pathname.startsWith('/rfg/admin') || pathname.startsWith('/attendance');
  const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/auth';

  if (isAdminPage || isAdminApi) {
    const adminCookie = request.cookies.get('admin-auth');
    if (adminCookie?.value !== 'authenticated') {
      if (isAdminApi) {
        return new NextResponse(JSON.stringify({ error: 'Admin authentication required' }), {
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
