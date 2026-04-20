'use client';

import Link from 'next/link';
import { MobileNav } from '@/components/MobileNav';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/rfg', label: 'Leaderboard' },
  { href: '/rfg/submit', label: 'Submit Race' },
  { href: '/rfg/runners', label: 'Runners' },
  { href: '/rfg/hall-of-fame', label: '2025 Results' },
  { href: '/rfg/admin', label: 'Admin' },
];

export default function RFGLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* RFG navigation bar - replaces the minimal root header */}
      <div style={{ background: 'var(--nav-bg)', marginTop: '-1rem', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <Link href="/rfg" className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-semibold text-white">
                Race for Gold
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
      </div>
      <div className="mt-4 sm:mt-6">
        {children}
      </div>
    </>
  );
}
