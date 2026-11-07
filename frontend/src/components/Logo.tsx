import Link from "next/link";

import { site } from "@/lib/site";

/**
 * The Orbit "Aperture" mark: a rounded square with a circular hole and a single
 * slice cut out to the right edge, with a solid core in the middle. It reads as
 * a lens and as the letter O.
 *
 * Flat shapes in one colour plus a knockout, so it stays sharp down to 20px and
 * prints in a single ink. Do not add gradients, strokes or glow.
 *
 * The knockout has to match whatever sits behind the mark, so pass `onNavy` in
 * the dark header. Anywhere else the default white is correct.
 */
export function LogoMark({
  className = "h-9 w-9",
  onNavy = false,
}: {
  className?: string;
  onNavy?: boolean;
}) {
  const tile = onNavy ? "#2f7bff" : "#0b5fff";
  const knockout = onNavy ? "#071630" : "#ffffff";

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Rounded square with the circular hole punched out */}
      <path
        d="M14 2h36a12 12 0 0 1 12 12v36a12 12 0 0 1-12 12H14A12 12 0 0 1 2 50V14A12 12 0 0 1 14 2Zm18 14a16 16 0 1 0 0 32 16 16 0 0 0 0-32Z"
        fill={tile}
      />
      {/* Slice running from the hole out to the right edge */}
      <rect x="40" y="28" width="24" height="8" fill={knockout} />
      {/* Core */}
      <circle cx="32" cy="32" r="6" fill={tile} />
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
