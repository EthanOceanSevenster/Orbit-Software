/**
 * Server-side access to the client portal.
 *
 * The session lives in an httpOnly cookie that JavaScript cannot read, so these
 * run on the server and forward the incoming cookie header to Django.
 */
import { cookies } from "next/headers";
import { cache } from "react";

import type {
  ClientAccount,
  Invoice,
  ServiceRequest,
  StaffOverview,
} from "@/lib/types";

const API_URL = (() => {
  const raw = (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000"
  ).trim();
  const withScheme = /^https?:\/\//.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/$/, "");
})();

type Result<T> = { ok: true; data: T } | { ok: false; status: number };

async function getAsUser<T>(path: string): Promise<Result<T>> {
  const cookieStore = await cookies();
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        cookie: cookieStore.toString(),
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    // Unreachable backend is treated as "not signed in" rather than a crash,
    // so the portal sends people to the login page instead of an error screen.
    return { ok: false, status: 503 };
  }
}

export function fetchMyAccount(): Promise<Result<ClientAccount>> {
  return getAsUser<ClientAccount>("/api/auth/me/");
}

export function fetchMyInvoices(): Promise<Result<Invoice[]>> {
  return getAsUser<Invoice[]>("/api/billing/invoices/");
}

export function fetchMyServiceRequests(): Promise<Result<ServiceRequest[]>> {
  return getAsUser<ServiceRequest[]>("/api/service-requests/");
}

/**
 * The owner's dashboard. 403 for anyone who is not staff.
 *
 * Wrapped in cache() because the console layout and the page inside it both
 * need it while rendering one request. Without this that is two identical
 * round trips to the API for every page view.
 */
export const fetchStaffOverview = cache(
  (): Promise<Result<StaffOverview>> => getAsUser<StaffOverview>("/api/staff/overview/"),
);
