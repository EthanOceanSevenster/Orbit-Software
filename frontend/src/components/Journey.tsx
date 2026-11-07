import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { JOURNEY } from "@/lib/content";

/**
 * The four stages from first contact to a running website.
 *
 * Each card says who does the work. Three of the four are ours, which is the
 * point visitors need to take away: almost nothing is asked of them.
 */
export function Journey() {
  return (
    <section id="how-it-works" className="border-y border-border bg-muted py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="From first message to a site that runs itself"
          text="Four stages, and you are only involved in the first one. Here is exactly what happens and who does it."
        />

        <ol className="relative mt-16 grid gap-8 lg:grid-cols-4 lg:gap-6">
          {/* Rail connecting the stages on wide screens */}
          <div
            className="absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-to-r from-brand/20 via-brand/40 to-brand/20 lg:block"
            aria-hidden="true"
          />

          {JOURNEY.map((step, index) => {
            const isYou = step.actor === "you";
            return (
              <li key={step.title} className="relative">
                {/* Stage marker sitting on the rail */}
                <div className="relative flex justify-center lg:justify-start">
                  <span
                    className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl ring-8 ring-muted ${
                      isYou
                        ? "bg-brand text-brand-foreground"
                        : "border border-border bg-card text-brand-ink"
                    }`}
                  >
                    <step.icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      STAGE {index + 1}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isYou
                          ? "bg-brand-soft text-brand-ink"
                          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {isYou ? "Your part" : "We do this"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                  <p className="mt-4 border-t border-border pt-3 text-xs font-medium text-muted-foreground">
                    {step.effort}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-14 text-center">
          <ButtonLink href="/get-started" size="lg">
            Start stage one <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <p className="mt-3 text-sm text-muted-foreground">
            It takes about ten minutes, and nothing is charged until we have agreed the work.
          </p>
        </div>
      </Container>
    </section>
  );
}

/** Small reusable "what to do next" link, used to close long sections. */
export function NextStep({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-12 text-center">
      <ButtonLink href={href} variant="secondary">
        {label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </ButtonLink>
    </div>
  );
}
