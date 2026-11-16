import Link from "next/link";

import { site } from "@/lib/site";

/**
 * The Orbit mark: a business at the centre, its website in orbit around it.
 *
 * What each part means, because a mark that means nothing is just decoration:
 *
 *   the solid core   your business, which is the thing that matters
 *   the ring         the work that goes round it every month, unbroken
 *   the satellite    your website, kept moving rather than parked
 *
 * It is also a letter O made of an orbit, so the name and the picture say the
 * same word. The ring is drawn as an open arc with the satellite sitting in
 * the gap, which is what stops it reading as a full stop at small sizes.
 *
 * Two colours at most, no gradients and no glow: it has to survive a browser
 * tab, a dark header, a white invoice and a single-colour print.
 */
export function LogoMark({
  className = "h-9 w-9",
  onNavy = false,
}: {
  className?: string;
  onNavy?: boolean;
}) {
  const ink = onNavy ? "#2f7bff" : "#0b5fff";
  const light = onNavy ? "#9cc4ff" : "#4e8dff";

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/*
        The orbit: an open ring, tilted, with the gap at the top right where
        the satellite sits. Drawn as a stroke so the counter stays open at
        any size, which a filled ring loses below about 24px.
      */}
      <g transform="rotate(-24 32 32)">
        <ellipse
          cx="32"
          cy="32"
          rx="25"
          ry="25"
          fill="none"
          stroke={ink}
          strokeWidth="7"
          strokeLinecap="round"
          /* Gap at the top right for the satellite to sit in. */
          strokeDasharray="118 40"
          strokeDashoffset="-16"
        />
      </g>

      {/* The business: solid, central, the thing everything else serves. */}
      <circle cx="32" cy="32" r="10" fill={ink} />

      {/* The website, in orbit. Lighter, because it belongs to the client. */}
      <circle cx="51" cy="14" r="7" fill={light} />
    </svg>
  );
}

export function Logo({ inverse = false }: { inverse?: boolean }) {
  const [first, ...rest] = site.name.split(" ");
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <LogoMark onNavy={inverse} />
      <span className={`text-lg tracking-tight ${inverse ? "text-white" : "text-foreground"}`}>
        <span className="font-bold">{first}</span>
        {rest.length ? <span className="font-normal opacity-75"> {rest.join(" ")}</span> : null}
      </span>
    </Link>
  );
}
