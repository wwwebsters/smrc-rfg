import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the landing page, login page, and auth APIs through
  if (
    pathname === '/' ||
    pathname === '/rfg/login' ||
    pathname === '/api/auth' ||
    pathname === '/api/admin/auth'
  ) {
    return NextResponse.next();
  }

  // Only protect /rfg routes and /api routes
  if (!pathname.startsWith('/rfg') && !pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check for site auth cookie
  const authCookie = request.cookies.get('site-auth');
  if (authCookie?.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/rfg/login', request.url));
  }

  // Admin pages and admin APIs require additional admin auth
  const isAdminPage = pathname.startsWith('/rfg/admin');
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
