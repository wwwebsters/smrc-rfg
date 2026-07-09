import { dbRun, dbAll, dbGet } from './db';

// Initialize analytics table (run once on first deploy)
export async function initAnalyticsTable(): Promise<void> {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      visitor_id TEXT,
      user_agent TEXT,
      referrer TEXT,
      timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create index for faster queries
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp)`);
}

// Track a page view
export async function trackPageView(
  path: string,
  visitorId?: string,
  userAgent?: string,
  referrer?: string
): Promise<void> {
  await dbRun(
    `INSERT INTO page_views (path, visitor_id, user_agent, referrer) VALUES (?, ?, ?, ?)`,
    [path, visitorId || null, userAgent || null, referrer || null]
  );
}

// Get page view stats
export interface PageViewStats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  uniqueVisitors: number;
  todayUnique: number;
  viewsByPage: { path: string; views: number }[];
  viewsByDay: { date: string; views: number }[];
  topReferrers: { referrer: string; count: number }[];
}

export async function getAnalyticsStats(): Promise<PageViewStats> {
  const now = Math.floor(Date.now() / 1000);
  const todayStart = now - (now % 86400); // Start of today UTC
  const weekStart = todayStart - (7 * 86400); // 7 days ago

  // Total views
  const totalResult = await dbGet<{ count: number }>(
    `SELECT COUNT(*) as count FROM page_views`
  );

  // Today's views
  const todayResult = await dbGet<{ count: number }>(
    `SELECT COUNT(*) as count FROM page_views WHERE timestamp >= ?`,
    [todayStart]
  );

  // This week's views
  const weekResult = await dbGet<{ count: number }>(
    `SELECT COUNT(*) as count FROM page_views WHERE timestamp >= ?`,
    [weekStart]
  );

  // Unique visitors (all time)
  const uniqueResult = await dbGet<{ count: number }>(
    `SELECT COUNT(DISTINCT visitor_id) as count FROM page_views WHERE visitor_id IS NOT NULL`
  );

  // Today's unique visitors
  const todayUniqueResult = await dbGet<{ count: number }>(
    `SELECT COUNT(DISTINCT visitor_id) as count FROM page_views WHERE visitor_id IS NOT NULL AND timestamp >= ?`,
    [todayStart]
  );

  // Views by page (top 10)
  const viewsByPage = await dbAll<{ path: string; views: number }>(
    `SELECT path, COUNT(*) as views FROM page_views GROUP BY path ORDER BY views DESC LIMIT 10`
  );

  // Views by day (last 14 days)
  const viewsByDay = await dbAll<{ date: string; views: number }>(
    `SELECT date(timestamp, 'unixepoch') as date, COUNT(*) as views
     FROM page_views
     WHERE timestamp >= ?
     GROUP BY date
     ORDER BY date DESC`,
    [todayStart - (14 * 86400)]
  );

  // Top referrers
  const topReferrers = await dbAll<{ referrer: string; count: number }>(
    `SELECT referrer, COUNT(*) as count
     FROM page_views
     WHERE referrer IS NOT NULL AND referrer != ''
     GROUP BY referrer
     ORDER BY count DESC
     LIMIT 5`
  );

  return {
    totalViews: totalResult?.count || 0,
    todayViews: todayResult?.count || 0,
    weekViews: weekResult?.count || 0,
    uniqueVisitors: uniqueResult?.count || 0,
    todayUnique: todayUniqueResult?.count || 0,
    viewsByPage,
    viewsByDay,
    topReferrers,
  };
}
