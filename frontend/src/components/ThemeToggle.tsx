"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

/**
 * What the visitor asked for. "system" means follow their device.
 *
 * Dark is the brand, not a preference: the site is a dark site, the way the
 * hero band always was, and a visitor who has never touched the toggle sees
 * it that way whatever their laptop is set to. "system" still does what it
 * says for anyone who picks it in the sidebar.
 */
export type Theme = "light" | "dark" | "system";

/** What is actually on screen. Always one or the other. */
type Resolved = "light" | "dark";

const STORAGE_KEY = "orbit-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Sets data-theme before the page paints, so nobody sees the wrong colours
 * first. Inlined into <head>, which is why it is plain JavaScript in a string:
 * nothing else has loaded yet.
 *
 * It always writes light or dark, never "system". Everything downstream, the
 * tokens and every dark: utility, keys off that one attribute, so there is a
 * single answer to what theme this page is in.
 */
export const THEME_SCRIPT = `(function(){try{
var s=localStorage.getItem('${STORAGE_KEY}');
var t=(s==='light'||s==='dark')?s:(s==='system'?(window.matchMedia('${DARK_QUERY}').matches?'dark':'light'):'dark');
document.documentElement.setAttribute('data-theme',t);
}catch(e){}})();`;

/*
 * The preference lives in localStorage, which React cannot watch.
 * useSyncExternalStore is how a component reads state from outside React;
 * reading it in an effect would mean setting state during the first render.
 */
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function prefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

function resolve(theme: Theme): Resolved {
  if (theme === "light" || theme === "dark") return theme;
  return prefersDark() ? "dark" : "light";
}

/** Nothing stored means dark, which is what the script writes before paint. */
const DEFAULT_THEME: Theme = "dark";

const TURN_MS = 340;
let turnTimer: ReturnType<typeof setTimeout> | null = null;

function paint(theme: Theme, animate = false) {
  const root = document.documentElement;

  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // Only while the colours are actually changing. Leaving it on would slow
    // every hover on the page to the same pace.
    root.classList.add("theme-turning");
    if (turnTimer) clearTimeout(turnTimer);
    turnTimer = setTimeout(() => root.classList.remove("theme-turning"), TURN_MS);
  }

  root.setAttribute("data-theme", resolve(theme));
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab changed it, so the two agree.
  window.addEventListener("storage", onChange);

  // The device switched to night mode. Only follow it while the visitor has
  // not chosen for themselves.
  const query = window.matchMedia(DARK_QUERY);
  const onScheme = () => {
    if (readTheme() === "system") paint("system", true);
    onChange();
  };
  query.addEventListener("change", onScheme);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
    query.removeEventListener("change", onScheme);
  };
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return DEFAULT_THEME;
  } catch {
    // Private windows and blocked site data.
    return DEFAULT_THEME;
  }
}

/** On the server there is no device to ask, so assume the default. */
function serverTheme(): Theme {
  return DEFAULT_THEME;
}

function choose(theme: Theme) {
  paint(theme, true);
  try {
    // "system" is stored like any other choice now: without it, nothing
    // stored would mean dark and the choice would not survive the next page.
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The choice still applies to this page, it just will not be remembered.
  }
  emit();
}

const OPTIONS: { value: Theme; label: string; short: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", short: "Light", icon: Sun },
  { value: "dark", label: "Dark", short: "Dark", icon: Moon },
  // Dark is the default; this follows the device only if somebody picks it.
  { value: "system", label: "Match my device", short: "Auto", icon: Monitor },
];

/**
 * The sidebar version: all three choices on screen at once.
 *
 * A sidebar has the room, and seeing the options beats discovering them by
 * pressing the same button three times.
 */
export function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  return (
    <div>
      <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">Appearance</p>
      <div
        role="group"
        aria-label="Appearance"
        className="flex rounded-lg border border-border bg-background p-1"
      >
        {OPTIONS.map((option) => {
          const active = option.value === theme;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              aria-pressed={active}
              title={option.label}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-brand-soft text-brand-ink"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <option.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {option.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
