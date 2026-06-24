import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { PageTransition } from "@/components/providers/page-transition";
import { LanguageProvider } from "@/lib/i18n/provider";
import { ThemeProvider } from "@/lib/theme/provider";
import { Navbar } from "@/components/layout/navbar";
import { SocialBar } from "@/components/layout/social-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "honghao report",
  description: "Trading card inventory & profit tracking for developers",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-hidden flex flex-col bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  const theme = localStorage.getItem('honghao-theme') || 'dark'
                  const resolved = theme === 'light' ? 'light' : 'dark'
                  document.documentElement.classList.add(resolved)
                  document.documentElement.style.colorScheme = resolved
                } catch (e) {}
              })()
            `,
          }}
        />
        <SessionProvider>
          <ThemeProvider>
            <LanguageProvider>
              <Navbar />
              <main className="flex-1 min-w-0 pt-14 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-10">
                <PageTransition>{children}</PageTransition>
              </main>
              <SocialBar />
            </LanguageProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
