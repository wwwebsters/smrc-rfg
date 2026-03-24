import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMRC - Race for Gold",
  description: "South Mason Running Club - Race for Gold Competition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  SMRC
                </span>
                <span className="text-sm font-medium text-yellow-100 hidden sm:inline">
                  Race for Gold
                </span>
              </Link>
              <div className="flex items-center gap-1 sm:gap-4">
                <NavLink href="/">Leaderboard</NavLink>
                <NavLink href="/runners">Runners</NavLink>
                <NavLink href="/hall-of-fame">2025 Results</NavLink>
                <NavLink href="/submit">Submit Race</NavLink>
                <NavLink href="/admin">Admin</NavLink>
              </div>
            </div>
          </nav>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-gray-800 text-gray-400 text-center py-4 text-sm">
          SMRC Race for Gold &copy; {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-yellow-100 hover:text-white px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}
