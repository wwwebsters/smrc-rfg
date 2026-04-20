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
    <div>
      {/* RFG Sub-navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-bold" style={{ color: 'var(--accent-blue)' }}>
            Race for Gold
          </span>
        </div>
        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[var(--accent-blue)] hover:text-white"
              style={{ color: 'var(--text-secondary)' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        {/* Mobile nav */}
        <MobileNav links={navLinks} />
      </div>
      {children}
    </div>
  );
}
