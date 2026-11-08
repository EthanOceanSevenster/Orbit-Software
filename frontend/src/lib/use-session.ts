"use client";

import { useEffect, useState } from "react";

import { PUBLIC_API_URL } from "@/lib/client-api";

export type Session = {
  /** True until the first answer arrives, so nothing flickers on a fast reply. */
  loading: boolean;
  signedIn: boolean;
  isStaff: boolean;
};

const SIGNED_OUT: Session = { loading: false, signedIn: false, isStaff: false };

/**
 * Who is looking at the page, asked from the browser.
 *
 * Deliberately not read on the server. The header is on every page, and
 * reading the session cookie during rendering would make the whole marketing
 * site dynamic, losing the prerendering that makes it quick. The cost is that
 * the header settles a moment after load, which only a signed-in visitor sees.
 *
 * This decides what to show, never what is allowed. Every page and endpoint
 * behind a login checks the session itself.
 */
export function useSession(): Session {
  const [session, setSession] = useState<Session>({
    loading: true,
    signedIn: false,
    isStaff: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${PUBLIC_API_URL}/api/auth/me/`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) {
          setSession(SIGNED_OUT);
          return;
        }
        const data = (await res.json()) as { is_staff?: boolean };
        if (cancelled) return;
        setSession({ loading: false, signedIn: true, isStaff: Boolean(data.is_staff) });
      } catch {
        // An unreachable API is not a signed-in visitor, and the header has
        // no business showing an error for it.
        if (!cancelled) setSession(SIGNED_OUT);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return session;
}
