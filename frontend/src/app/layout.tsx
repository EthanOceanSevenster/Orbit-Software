import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SiteChrome } from "@/components/SiteChrome";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import { site } from "@/lib/site";

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
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Runs before the first paint, so somebody who chose light never sees
          a dark page flash first. It only reads one value and sets one
          attribute; the stylesheet does the rest.
        */}
        {/* Tells the browser to paint its canvas dark before a single
            stylesheet has loaded. Without it the first frame is white, which
            is the flash you see on a slow connection no matter how early the
            theme script runs. */}
        <meta name="color-scheme" content="dark light" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      {/* suppressHydrationWarning: browser extensions add attributes to <body> before React hydrates. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <SiteChrome header={<Header />} footer={<Footer />}>
          {/*
            No page crossfade. It animated on first load as well as on
            navigation, which reads as the site still loading, and a business
            site is judged on how settled it looks in the first second.
          */}
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
