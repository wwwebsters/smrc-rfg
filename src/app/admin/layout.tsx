'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuthProvider } from '@/components/AdminAuth';

const adminLinks = [
  { href: '/admin', label: 'Pending Submissions' },
  { href: '/admin/results', label: 'Approved Results' },
  { href: '/admin/runners', label: 'Manage Runners' },
  { href: '/admin/upload', label: 'Upload Data' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminAuthProvider>
      <div>
        {/* Sub-navigation */}
        <div className="flex flex-wrap gap-2 mb-6" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
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
