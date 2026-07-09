import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, getAnalyticsStats, initAnalyticsTable } from '@/lib/analytics';
import { cookies } from 'next/headers';
import { verifyCookie } from '@/lib/cookie-signing';

// POST: Track a page view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    // Get or create visitor ID from cookie
    const cookieStore = await cookies();
    let visitorId = cookieStore.get('visitor_id')?.value;

    const response = NextResponse.json({ success: true });

    if (!visitorId) {
      visitorId = crypto.randomUUID();
      response.cookies.set('visitor_id', visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60, // 1 year
      });
    }

    const userAgent = request.headers.get('user-agent') || undefined;
    const referrer = request.headers.get('referer') || undefined;

    await trackPageView(path, visitorId, userAgent, referrer);

    return response;
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}

// GET: Get analytics stats (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin auth (cookies are signed)
    const cookieStore = await cookies();
    const rfgAuth = cookieStore.get('admin-auth-rfg')?.value;
    const attendanceAuth = cookieStore.get('admin-auth-attendance')?.value;

    const isRfgAuthed = rfgAuth && verifyCookie(rfgAuth) === 'authenticated';
    const isAttendanceAuthed = attendanceAuth && verifyCookie(attendanceAuth) === 'authenticated';

    if (!isRfgAuthed && !isAttendanceAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize table if needed (idempotent)
    try {
      await initAnalyticsTable();
    } catch (initError) {
      console.error('Failed to init analytics table:', initError);
      // Return empty stats if table creation fails
      return NextResponse.json({
        totalViews: 0,
        todayViews: 0,
        weekViews: 0,
        uniqueVisitors: 0,
        todayUnique: 0,
        viewsByPage: [],
        viewsByDay: [],
        topReferrers: [],
      });
    }

    const stats = await getAnalyticsStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    // Return empty stats instead of error
    return NextResponse.json({
      totalViews: 0,
      todayViews: 0,
      weekViews: 0,
      uniqueVisitors: 0,
      todayUnique: 0,
      viewsByPage: [],
      viewsByDay: [],
      topReferrers: [],
    });
  }
}
