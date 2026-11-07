export function SectionHeading({
  eyebrow,
  title,
  text,
  align = "center",
  invert = false,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "center" | "left";
  invert?: boolean;
}) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";
  return (
    <div className={`max-w-3xl ${alignment}`}>
      {eyebrow ? (
        <p
          className={`text-sm font-semibold uppercase tracking-[0.12em] ${
            invert ? "text-sky-300" : "text-brand-ink"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${
          invert ? "text-white" : ""
        }`}
      >
        {title}
      </h2>
      {text ? (
        <p
          className={`mt-4 text-lg leading-relaxed ${
            invert ? "text-slate-300" : "text-muted-foreground"
          }`}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}
