import Link from 'next/link';
import { MobileNav } from '@/components/MobileNav';

const navItems = [
  { label: 'Leaderboard', href: '/attendance' },
  { label: 'Runners', href: '/attendance/runners' },
];

const adminNavItems = [
  { label: 'Admin', href: '/attendance/admin' },
];

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header style={{ background: 'var(--nav-bg)' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-6 sm:gap-8">
              <Link href="/" className="flex items-center gap-2 sm:gap-3">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  SMRC
                </span>
              </Link>
              <Link
                href="/attendance"
                className="text-sm sm:text-base font-medium"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Attendance
              </Link>
              <div className="hidden sm:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium hover:text-white transition-colors"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium hover:text-white transition-colors"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <MobileNav items={[...navItems, ...adminNavItems]} />
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </>
  );
}
