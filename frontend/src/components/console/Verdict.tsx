import { ArrowRight, CircleCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";

export type VerdictJob = {
  /** One plain sentence: what is wrong and what to do about it. */
  text: string;
  href?: string;
  action?: string;
};

/**
 * The page's answer, written out, above the page's numbers.
 *
 * Every screen in this console used to open with four figures and leave the
 * owner to work out whether today was fine. This says it instead: green when
 * nothing needs doing, amber with the jobs named and linked when something
 * does. Same shape on every page, so it is read once and recognised after.
 */
export function Verdict({
  settled,
  title,
  summary,
  jobs = [],
}: {
  settled: boolean;
  title: string;
  summary?: React.ReactNode;
  jobs?: VerdictJob[];
}) {
  return (
    <section
      className={`rounded-2xl border p-5 sm:p-7 ${
        settled ? "border-border bg-card" : "border-amber-500/40 bg-amber-500/[0.07]"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
            settled
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          }`}
        >
          {settled ? (
            <CircleCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <TriangleAlert
              className="h-5 w-5 sm:h-6 sm:w-6"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>

          {summary ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {summary}
            </p>
          ) : null}

          {jobs.length > 0 ? (
            <ul className="mt-3 space-y-2.5">
              {jobs.map((job) => (
                <li
                  key={job.text}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base"
                >
                  <span className="leading-relaxed">{job.text}</span>
                  {job.href && job.action ? (
                    <Link
                      href={job.href}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline"
                    >
                      {job.action}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
