import type { MetadataRoute } from "next";

import { CLIENT_SITES } from "@/lib/clients";
import { SERVICES } from "@/lib/content";
import { site } from "@/lib/site";

/**
 * Every page worth finding, and nothing behind a login.
 *
 * The portal and the console are deliberately absent: they are private, they
 * are already noindex, and listing them would only tell a crawler where the
 * doors are.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  const now = new Date();

  const pages = [
    { path: "/", priority: 1 },
    { path: "/pricing", priority: 0.9 },
    { path: "/services", priority: 0.8 },
    { path: "/work", priority: 0.8 },
    { path: "/contact", priority: 0.7 },
    { path: "/get-started", priority: 0.7 },
    { path: "/terms", priority: 0.3 },
    { path: "/privacy", priority: 0.3 },
    { path: "/refund-policy", priority: 0.3 },
  ];

  return [
    ...pages.map((page) => ({
      url: `${base}${page.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: page.priority,
    })),
    ...SERVICES.map((service) => ({
      url: `${base}/services#${service.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...CLIENT_SITES.map((client) => ({
      url: `${base}/work/${client.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
