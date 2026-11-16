import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * Crawlers are welcome on the marketing pages and nowhere else.
 *
 * The portal, the console and the API are disallowed as well as noindex:
 * noindex keeps a page out of results, this keeps a crawler out of the page.
 */
export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account/", "/dashboard/", "/api/", "/login", "/register"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
