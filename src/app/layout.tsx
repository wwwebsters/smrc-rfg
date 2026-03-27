import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { MobileNav } from "@/components/MobileNav";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: 'var(--background)', color: 'var(--text-primary)' }}>
        <header style={{ background: 'var(--nav-bg)' }}>
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/" className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  SMRC
                </span>
                <span className="text-base font-medium hidden sm:inline text-white">
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
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {children}
        </main>
        <footer style={{ background: 'var(--nav-bg)' }} className="text-center py-3 sm:py-4 text-xs sm:text-sm text-white">
          <div>SMRC &copy; {new Date().getFullYear()}</div>
          <div className="italic mt-1">Run all the miles, drink all the beer.&trade;</div>
        </footer>
      </body>
    </html>
  );
}
