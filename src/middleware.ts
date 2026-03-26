import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page and auth APIs through
  if (
    pathname === '/login' ||
    pathname === '/api/auth' ||
    pathname === '/api/admin/auth'
  ) {
    return NextResponse.next();
  }

  // Check for site auth cookie
  const authCookie = request.cookies.get('site-auth');
  if (authCookie?.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin page and admin action APIs require additional admin auth
  const isAdminPage = pathname === '/admin';
  const isAdminActionApi = pathname === '/api/admin/review' || pathname === '/api/admin/upload' || pathname === '/api/admin/results';

  if (isAdminPage || isAdminActionApi) {
    const adminCookie = request.cookies.get('admin-auth');
    if (adminCookie?.value !== 'authenticated') {
      if (isAdminActionApi) {
        return new NextResponse(JSON.stringify({ error: 'Admin authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // For the admin page, let it through — the page handles its own login prompt
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
