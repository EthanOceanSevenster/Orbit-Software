import type { LucideIcon } from "lucide-react";

const BOX = { sm: "h-11 w-11", md: "h-14 w-14", lg: "h-16 w-16" };
const GLYPH = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-7 w-7" };

type Size = keyof typeof BOX;

/**
 * Square icon badge: soft brand gradient, a hairline ring and a lift on hover.
 * Used across every feature grid so icons read as one family.
 */
export function IconBadge({
  icon: Icon,
  size = "md",
  className = "",
}: {
  icon: LucideIcon;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={`relative flex ${BOX[size]} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-soft to-brand-soft/40 text-brand-ink ring-1 ring-inset ring-brand/20 transition-all duration-300 group-hover:from-brand group-hover:to-sky-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand/25 group-hover:ring-brand/40 ${className}`}
    >
      <Icon className={`${GLYPH[size]} transition-transform duration-300 group-hover:scale-110`} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}

/** Badge for dark sections, where the soft brand tint has too little contrast. */
export function IconBadgeDark({
  icon: Icon,
  size = "md",
  className = "",
}: {
  icon: LucideIcon;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={`relative flex ${BOX[size]} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/35 to-sky-400/10 text-sky-300 ring-1 ring-inset ring-white/15 transition-all duration-300 group-hover:from-brand group-hover:to-sky-400 group-hover:text-white ${className}`}
    >
      <Icon className={GLYPH[size]} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}

/** Bordered card with an icon, title and short text. */
export function IconTile({
  icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-slate-900/10">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
      <IconBadge icon={icon} />
      <h3 className="mt-6 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

/** Compact inline item: icon on the left, title and text on the right. */
export function IconRow({ icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="group flex gap-4">
      <IconBadge icon={icon} size="sm" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
