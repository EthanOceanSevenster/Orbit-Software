/**
 * Server-side access to the Django API. Used by Server Components.
 * Falls back gracefully (returns null) when the API is unreachable so the
 * marketing site keeps working even if the backend is down.
 */
import type { AddOn, Plan } from "@/lib/types";

const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

async function getList<T>(path: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      signal: AbortSignal.timeout(3000),
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
