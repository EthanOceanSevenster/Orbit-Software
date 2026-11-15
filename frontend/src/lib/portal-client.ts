"use client";

/**
 * Browser-side portal calls: signing in, signing out, and starting a payment.
 *
 * Django uses session cookies, which means CSRF applies to anything that
 * changes state. Fetch the token once, then send it back in the X-CSRFToken
 * header. The session cookie itself is httpOnly, so it is never touched here.
 */
import { normaliseErrors, PUBLIC_API_URL, type FieldErrors } from "@/lib/client-api";

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

async function csrfToken(refresh = false): Promise<string> {
  if (!refresh) {
    const existing = readCookie("csrftoken");
    if (existing) return existing;
  }
  await fetch(`${PUBLIC_API_URL}/api/auth/csrf/`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return readCookie("csrftoken");
}

function send(path: string, token: string, body?: unknown) {
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

async function post(path: string, body?: unknown) {
  const response = await send(path, await csrfToken(), body);

  // A 403 here is almost always a CSRF token that no longer matches: the
  // cookie was cleared, or document.cookie handed back one set for another
  // host, or Django rotated it and this tab still holds the old one. Reading
  // the cookie cannot tell those apart, so fetch a fresh token and try once
  // more. Only a second 403 is a refusal worth showing someone.
  if (response.status !== 403) return response;
  return send(path, await csrfToken(true), body);
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
    if (res.status === 403) {
      // A fresh token was already tried, so this is not a stale cookie.
      return {
        ok: false,
        message:
          "Your browser would not send a security cookie. Check that cookies are " +
          "allowed for this site, then reload and try again.",
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
  | { ok: true; url: string; accessCode: string; reference: string }
  | { ok: false; message: string };

/**
 * Starts a payment.
 *
 * Returns both ways of finishing it: an access code, which opens Paystack's
 * panel over the page the customer is already on, and a full URL to send them
 * to if the panel cannot load. Neither decides whether anything is paid. That
 * still takes a verified answer from Paystack, asked for by our own server.
 */
export async function startPayment(invoiceId: number): Promise<PayResult> {
  try {
    const res = await post(`/api/billing/invoices/${invoiceId}/pay/`);
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      authorization_url?: string;
      access_code?: string;
      reference?: string;
      detail?: string;
    };
    if (res.ok && data.ok && data.authorization_url) {
      return {
        ok: true,
        url: data.authorization_url,
        accessCode: data.access_code ?? "",
        reference: data.reference ?? "",
      };
    }
    return {
      ok: false,
      message: data.detail ?? "We could not start that payment. Please try again.",
    };
  } catch {
    return { ok: false, message: "We could not reach the server. Check your connection." };
  }
}

const INLINE_SCRIPT = "https://js.paystack.co/v2/inline.js";

type PaystackPopup = {
  resumeTransaction: (
    accessCode: string,
    callbacks?: {
      onSuccess?: (response: unknown) => void;
      onCancel?: () => void;
      onError?: (error: unknown) => void;
    },
  ) => unknown;
};

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopup;
  }
}

/** Loads Paystack's panel script once, and resolves false if it cannot. */
export function loadPaystackInline(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.PaystackPop) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${INLINE_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.PaystackPop)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = INLINE_SCRIPT;
    script.async = true;
    script.onload = () => resolve(Boolean(window.PaystackPop));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export type RegisterInput = {
  name: string;
  email: string;
  company_name: string;
  password: string;
};

export type RegisterResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors: FieldErrors };

/** Creates a login and an empty, pending account, then signs them in. */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  try {
    const res = await post("/api/auth/register/", input);
    if (res.ok) return { ok: true };

    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      const fieldErrors = normaliseErrors(data);
      const general = fieldErrors.non_field_errors?.[0] ?? fieldErrors.detail?.[0];
      return {
        ok: false,
        message: general ?? "Please check the highlighted fields and try again.",
        fieldErrors,
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        message: "Too many sign-ups from this network. Please try again later.",
        fieldErrors: {},
      };
    }
    if (res.status === 403) {
      return {
        ok: false,
        message:
          "Your browser would not send a security cookie. Check that cookies are " +
          "allowed for this site, then reload and try again.",
        fieldErrors: {},
      };
    }
    return {
      ok: false,
      message: "Something went wrong on our side. Please try again.",
      fieldErrors: {},
    };
  } catch {
    return {
      ok: false,
      message: "We could not reach the server. Check your connection.",
      fieldErrors: {},
    };
  }
}

export type ServiceRequestResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors: FieldErrors };

/** Asks us for a piece of extra work. The account comes from the session. */
export async function requestService(
  service: string,
  details: string,
): Promise<ServiceRequestResult> {
  try {
    const res = await post("/api/service-requests/", { service, details });
    if (res.ok) return { ok: true };

    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      const fieldErrors = normaliseErrors(data);
      return {
        ok: false,
        message:
          fieldErrors.non_field_errors?.[0] ??
          "Please check the highlighted fields and try again.",
        fieldErrors,
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        message: "You have sent a few of these already. Please give us a day to reply.",
        fieldErrors: {},
      };
    }
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    return {
      ok: false,
      message: data.detail ?? "We could not send that request. Please try again.",
      fieldErrors: {},
    };
  } catch {
    return {
      ok: false,
      message: "We could not reach the server. Check your connection.",
      fieldErrors: {},
    };
  }
}

/**
 * Send the client to Payfast to save a card.
 *
 * Payfast will not accept a GET with the fields in the query string, and we
 * would not want it anyway: the signature would end up in browser history
 * and in any proxy log on the way. So we ask our own API for the signed
 * fields, build a form in memory and post it.
 */
export async function savePayfastCard(): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await post("/api/billing/payfast/start/");
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      return {
        ok: false,
        message: data.detail ?? "We could not start that. Please try again.",
      };
    }

    const { action, fields } = (await res.json()) as {
      action: string;
      fields: Record<string, string>;
    };

    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.append(input);
    }
    document.body.append(form);
    form.submit();
    return { ok: true };
  } catch {
    return { ok: false, message: "We could not reach the server. Check your connection." };
  }
}

/** Turn automatic payment on or off, or remove the card entirely. */
export async function updateSavedCard(
  change: { autopay: boolean } | "remove",
): Promise<{ ok: boolean; message?: string }> {
  const token = await csrfToken();
  try {
    const res = await fetch(`${PUBLIC_API_URL}/api/billing/card/`, {
      method: change === "remove" ? "DELETE" : "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { "X-CSRFToken": token } : {}),
      },
      body: change === "remove" ? undefined : JSON.stringify(change),
    });
    if (res.ok) return { ok: true };
    return { ok: false, message: "That did not save. Please try again." };
  } catch {
    return { ok: false, message: "We could not reach the server. Check your connection." };
  }
}
