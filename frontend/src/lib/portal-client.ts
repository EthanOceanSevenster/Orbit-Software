"use client";

/**
 * Browser-side portal calls: signing in, signing out, and starting a payment.
 *
 * Django uses session cookies, which means CSRF applies to anything that
 * changes state. Fetch the token once, then send it back in the X-CSRFToken
 * header. The session cookie itself is httpOnly, so it is never touched here.
 */
import { PUBLIC_API_URL } from "@/lib/client-api";

function readCookie(name: string): string {
  // Split rather than build a regex. A previous version interpolated the name
  // into a template literal, where the \s escape collapsed to a literal "s",
  // so the token was only found when it happened to be the first cookie.
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

async function csrfToken(): Promise<string> {
  const existing = readCookie("csrftoken");
  if (existing) return existing;
  await fetch(`${PUBLIC_API_URL}/api/auth/csrf/`, { credentials: "same-origin" });
  return readCookie("csrftoken");
}

async function post(path: string, body?: unknown) {
  const token = await csrfToken();
  return fetch(`${PUBLIC_API_URL}${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { "X-CSRFToken": token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export type LoginResult = { ok: true } | { ok: false; message: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const res = await post("/api/auth/login/", { email, password });
    if (res.ok) return { ok: true };
    if (res.status === 401) {
      return { ok: false, message: "Those details do not match an account." };
    }
    if (res.status === 429) {
      return {
        ok: false,
        message: "Too many attempts from this network. Please try again later.",
      };
    }
    const data = await res.json().catch(() => ({}));
    return {
      ok: false,
      message: (data as { detail?: string }).detail ?? "Sign in failed. Please try again.",
    };
  } catch {
    return { ok: false, message: "We could not reach the server. Check your connection." };
  }
}

export async function logout(): Promise<void> {
  await post("/api/auth/logout/").catch(() => undefined);
}

export type PayResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/** Starts a payment. Returns where to send the browser, or why it cannot. */
export async function startPayment(invoiceId: number): Promise<PayResult> {
  try {
    const res = await post(`/api/billing/invoices/${invoiceId}/pay/`);
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      authorization_url?: string;
      detail?: string;
    };
    if (res.ok && data.ok && data.authorization_url) {
      return { ok: true, url: data.authorization_url };
    }
    return {
      ok: false,
      message: data.detail ?? "We could not start that payment. Please try again.",
    };
  } catch {
    return { ok: false, message: "We could not reach the server. Check your connection." };
  }
}
