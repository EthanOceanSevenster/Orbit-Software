import type { Metadata } from "next";
import { ViewTransition } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SiteChrome } from "@/components/SiteChrome";
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
    >
      {/* suppressHydrationWarning: browser extensions add attributes to <body> before React hydrates. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <SiteChrome header={<Header />} footer={<Footer />}>
          {/*
            Crossfades and lifts the page on navigation, so moving between
            pages reads as one continuous site rather than a hard cut.
            Browsers without the View Transitions API simply navigate as
            before.
          */}
          <ViewTransition name="page" default="page-shift">
            {children}
          </ViewTransition>
        </SiteChrome>
      </body>
    </html>
  );
}
