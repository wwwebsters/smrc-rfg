'use client';

const sections = [
  {
    title: 'Frontend',
    items: [
      'Next.js 16 (App Router)',
      'React 19',
      'TypeScript',
      'Tailwind CSS 4',
      'Poppins font (Google Fonts)',
    ],
  },
  {
    title: 'Backend',
    items: [
      'Next.js API Routes (serverless functions)',
      'Turso (cloud-hosted SQLite via libsql)',
    ],
  },
  {
    title: 'Hosting & Deployment',
    items: [
      'Vercel (auto-deploys from GitHub on push)',
      'Custom domain: smrc.club (via Namecheap)',
      'SSL: automatic via Vercel',
    ],
  },
  {
    title: 'Data & Seeding',
    items: [
      'xlsx library (Excel file parsing)',
      'Seed script (npx tsx scripts/seed.ts) to populate DB from spreadsheets',
      'dotenv for environment variable management',
    ],
  },
  {
    title: 'Authentication',
    items: [
      'Cookie-based site password (30-day session)',
      'Separate cookie-based admin password (24-hour session)',
      'Next.js middleware for route protection',
    ],
  },
  {
    title: 'Notifications',
    items: [
      'Discord webhook (fires on new race submissions)',
    ],
  },
  {
    title: 'Testing',
    items: [
      'Vitest (23 API integration tests)',
      'Playwright installed (available for future E2E browser tests)',
    ],
  },
  {
    title: 'Source Control',
    items: [
      'Git / GitHub (public repo at github.com/wwwebsters/smrc-rfg)',
    ],
  },
  {
    title: 'Development Tools',
    items: [
      'Node.js 24',
      'tsx (TypeScript execution for scripts)',
      'VS Code with Claude Code extension',
    ],
  },
];

export default function TechStackPage() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sections.map((section) => (
        <div key={section.title} className="card p-4 sm:p-5">
          <h3 className="font-semibold mb-3" style={{ color: 'var(--accent-blue)' }}>{section.title}</h3>
          <ul className="space-y-1.5">
            {section.items.map((item) => (
              <li key={item} className="text-sm flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-gold)' }}>-</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
