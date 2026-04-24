'use client';

import Link from 'next/link';
import { MobileNav } from '@/components/MobileNav';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/attendance', label: 'Leaderboard' },
  { href: '/attendance/runners', label: 'Runners' },
  { href: '/attendance/admin', label: 'Admin' },
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
            <Link href="/attendance" className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                SMRC
              </span>
              <span className="text-base font-medium hidden sm:inline text-white">
                Attendance
              </span>
            </Link>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10 text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {/* Mobile nav */}
            <MobileNav links={navLinks} />
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </>
  );
}
