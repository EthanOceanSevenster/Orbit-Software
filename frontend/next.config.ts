import type { NextConfig } from "next";

/**
 * Where the Django API lives, as seen from the Next.js server.
 *
 * On Render this is the backend's public https URL, injected by `render.yaml`
 * as `API_URL`. Render's free instances cannot receive private network traffic,
 * so the private host:port address is not usable there. A bare `host:port` is
 * still accepted and gets an http scheme, which is what a paid private-network
 * setup would supply. Locally it falls back to the dev server on port 8000.
 *
 * Only this server reads it. The browser never sees it, so the site stays on a
 * single origin either way.
 */
function backendOrigin(): string {
  const raw = (process.env.API_URL ?? "http://localhost:8000").trim();
  const withScheme = /^https?:\/\//.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  cacheComponents: true,

  /**
   * Django's URLs all end in a slash. Without this, Next.js would redirect
   * /api/plans/ to /api/plans before the rewrite ran, and Django would answer
   * with a redirect of its own, bouncing the request back to this origin.
   */
  skipTrailingSlashRedirect: true,

  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  /**
   * Proxy the API through this server so the browser only ever talks to one
   * origin. That removes the need for CORS in production and keeps the backend
   * reachable even when it has no public URL of its own.
   *
   * `next start` reads this file when the server boots, so `API_URL` is read at
   * runtime rather than baked in at build time.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path+",
        // Next.js strips the trailing slash while matching, so `:path+` never
        // carries one. Django's URLs all end in a slash, and without it Django
        // answers with a redirect that points back here and loops. Re-adding
        // the slash on the destination is what keeps the proxy working.
        destination: `${backendOrigin()}/api/:path+/`,
      },
    ];
  },
};

export default nextConfig;
