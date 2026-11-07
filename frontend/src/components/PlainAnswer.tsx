import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { IconBadge } from "@/components/IconTile";
import { PLAIN_ANSWER } from "@/lib/content";
import { formatMoney, site } from "@/lib/site";

/**
 * The first thing after the hero. Answers "what do you actually do?" in three
 * short lines before any detail, so a visitor who reads nothing else still
 * understands the offer.
 */
export function PlainAnswer() {
  return (
    <section className="border-b border-border bg-card py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-ink">
            In plain English
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            You need a website. We handle all of it.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            There is nothing for you to install, host or maintain. You tell us about your
            business, and we take it from there.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {PLAIN_ANSWER.map((item, index) => (
            <li
              key={item.label}
              className="group relative rounded-2xl border border-border bg-background p-8 text-center"
            >
              <span className="absolute right-6 top-6 text-5xl font-bold leading-none text-muted-foreground/15">
                {index + 1}
              </span>
              <div className="flex justify-center">
                <IconBadge icon={item.icon} size="lg" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-center gap-5 rounded-2xl bg-muted px-8 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-lg">
            <strong className="font-semibold">{formatMoney(site.pricing.setupFee)}</strong> once to
            build it, then{" "}
            <strong className="font-semibold">{formatMoney(site.pricing.monthlyFee)}</strong> a
            month for hosting. A business email address on your own domain is{" "}
            <strong className="font-semibold">{formatMoney(site.pricing.emailAddonFee)}</strong>{" "}
            more, if you want one.
          </p>
          <ButtonLink href="#how-it-works" variant="secondary" className="shrink-0">
            See how it works <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
