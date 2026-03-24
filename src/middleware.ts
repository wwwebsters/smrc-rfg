import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow the login page and auth API through
  if (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/api/auth'
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('site-auth');
  if (authCookie?.value === 'authenticated') {
    return NextResponse.next();
  }

  // Redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
