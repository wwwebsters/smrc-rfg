import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  title: "SMRC",
  description: "South Mason Running Club",
};

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
        {children}
        <footer style={{ background: 'var(--nav-bg)' }} className="text-center py-3 sm:py-4 text-xs sm:text-sm text-white">
          <div>SMRC &copy; {new Date().getFullYear()}</div>
          <div className="italic mt-1">Run all the miles, drink all the beer.&trade;</div>
        </footer>
      </body>
    </html>
  );
}
