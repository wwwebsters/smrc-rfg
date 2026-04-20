'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuthProvider } from '@/components/AdminAuth';

const adminLinks = [
  { href: '/rfg/admin', label: 'Pending Submissions' },
  { href: '/rfg/admin/results', label: 'Approved Results' },
  { href: '/rfg/admin/runners', label: 'Manage Runners' },
  { href: '/rfg/admin/add-runner', label: 'Add Runner' },
  { href: '/rfg/admin/upload', label: 'Upload Data' },
  { href: '/rfg/admin/tech-stack', label: 'Tech Stack' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLabel = adminLinks.find((l) => l.href === pathname)?.label || 'Admin';

  return (
    <AdminAuthProvider>
      <div>
        {/* Mobile sub-nav */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent-blue)', color: 'white' }}
          >
            <span>{activeLabel}</span>
            <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {menuOpen && (
            <div className="mt-1 card overflow-hidden">
              {adminLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium transition-colors"
                    style={{
                      background: isActive ? 'rgba(0,115,234,0.08)' : 'transparent',
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      borderBottom: '1px solid var(--card-border)',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop sub-nav */}
        <div className="hidden md:flex flex-wrap gap-2 mb-6" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive ? 'var(--accent-blue)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  border: isActive ? 'none' : '1px solid var(--card-border)',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </AdminAuthProvider>
  );
}
