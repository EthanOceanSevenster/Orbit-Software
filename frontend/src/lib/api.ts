/**
 * Server-side access to the Django API. Used by Server Components.
 * Falls back gracefully (returns null) when the API is unreachable so the
 * marketing site keeps working even if the backend is down.
 */
import type { AddOn, Plan } from "@/lib/types";

/**
 * On Render this is the backend's address on the private network, injected by
 * `render.yaml` as `API_URL`. Render supplies it as `host:port` with no scheme,
 * so the scheme is added when it is missing.
 *
 * Server Components talk to the backend directly rather than going out through
 * the public URL and back in, which saves a round trip.
 */
const API_URL = (() => {
  const raw = (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000"
  ).trim();
  const withScheme = /^https?:\/\//.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/$/, "");
})();

async function getList<T>(path: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return Array.isArray(data) && data.length > 0 ? (data as T[]) : null;
  } catch {
    return null;
  }
}

export function fetchPlans(): Promise<Plan[] | null> {
  return getList<Plan>("/api/plans/");
}

export function fetchAddOns(): Promise<AddOn[] | null> {
  return getList<AddOn>("/api/addons/");
}
