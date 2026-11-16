"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { LogoMark } from "@/components/Logo";
import { site } from "@/lib/site";

/**
 * The whole screen, for two seconds, after a correct password.
 *
 * Rendered through a portal onto <body> rather than inside the login card,
 * because the point is that the card is gone: you are not filling in a form
 * any more, you are being let in. Everything the form was is covered.
 *
 * The timing is not decoration for its own sake. The portal route is
 * prefetched the moment this appears, so the bar filling across the bottom
 * is the actual wait, and it finishes as the dashboard arrives. Without it
 * the same wait happens anyway, as a blank screen.
 *
 * It does not fade out. It is unmounted by the navigation it is covering,
 * which is the only moment there is nothing behind it worth hiding.
 */
export function WelcomeSplash() {
  useEffect(() => {
    // The page behind must not scroll while the screen is taken over.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Only ever rendered after a submit, so there is no server pass to guard
  // against — but a portal needs a real document either way.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="welcome" role="status" aria-live="polite">
      <div className="welcome-stage">
        <div className="welcome-mark">
          {/* Three rings going out, then the sweep, then the mark on top. */}
          <span className="welcome-ring" aria-hidden="true" />
          <span className="welcome-ring" aria-hidden="true" />
          <span className="welcome-ring" aria-hidden="true" />
          <span className="welcome-sweep" aria-hidden="true" />
          <LogoMark className="h-20 w-20" onNavy />
        </div>

        <h1 className="welcome-title mt-9 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Welcome to {site.name}
        </h1>

        <p className="welcome-sub mt-3 text-sm text-slate-400 sm:text-base">
          Getting your portal ready&hellip;
        </p>

        <div className="welcome-bar mt-8 h-1 w-48 bg-white/10 sm:w-64">
          <span className="bg-gradient-to-r from-sky-400 to-blue-500" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
