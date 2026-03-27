import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { MobileNav } from "@/components/MobileNav";

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

const navLinks = [
  { href: "/", label: "Leaderboard" },
  { href: "/submit", label: "Submit Race" },
  { href: "/runners", label: "Runners" },
  { href: "/hall-of-fame", label: "2025 Results" },
  { href: "/admin", label: "Admin" },
];

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  SMRC
                </span>
                <span className="text-sm font-medium text-yellow-100 hidden sm:inline">
                  Race for Gold
                </span>
              </Link>
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-yellow-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
        <footer className="bg-gray-800 text-gray-400 text-center py-3 sm:py-4 text-xs sm:text-sm">
          <div>SMRC &copy; {new Date().getFullYear()}</div>
          <div className="italic mt-1">Run all the miles, drink all the beer.</div>
        </footer>
      </body>
    </html>
  );
}
