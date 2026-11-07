import { CircleCheck, Mail } from "lucide-react";
import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { GetStartedForm } from "@/components/forms/GetStartedForm";
import { PageHeader } from "@/components/PageHeader";
import { FALLBACK_PLANS, STEPS } from "@/lib/content";
import Link from "next/link";

import { formatMoney, publicEmail, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get started",
  description: `Tell ${site.name} about your website project. ${formatMoney(site.pricing.setupFee)} setup, ${formatMoney(site.pricing.monthlyFee)} per month.`,
};

export default function GetStartedPage() {
  const plan = FALLBACK_PLANS[0];

  return (
    <>
      <PageHeader
        eyebrow="Get started"
        title="Tell us about your website"
        text="A few details are all we need. Our team will come back to you to confirm the scope before any work starts."
      />

      <section className="bg-muted py-16 sm:py-20">
        <Container className="grid items-start gap-8 lg:grid-cols-12">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10 lg:col-span-7">
            <h2 className="text-xl font-semibold">Project details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Takes about ten minutes. Anything marked optional can be left blank.</p>
            <div className="mt-8">
              <GetStartedForm planSlug={plan.slug} />
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-5">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="h-1.5 bg-gradient-to-r from-brand to-sky-400" />
              <div className="p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink">Your plan</p>
                <h2 className="mt-2 text-lg font-semibold">{plan.name}</h2>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight">
                    {formatMoney(plan.monthly_fee, plan.currency)}
                  </span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Once-off setup fee</span>
                  <span className="font-semibold">{formatMoney(plan.setup_fee, plan.currency)}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
              <h2 className="font-semibold">What happens next</h2>
              <ol className="mt-5 space-y-5">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
                      <step.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 text-sm">
              <p className="font-semibold">Prefer to ask a question first?</p>
              <div className="mt-3 space-y-2 text-muted-foreground">
                {publicEmail ? (
                  <a href={`mailto:${publicEmail}`} className="flex items-center gap-2.5 hover:text-foreground">
                    <Mail className="h-4 w-4 text-brand-ink" aria-hidden="true" /> {publicEmail}
                  </a>
                ) : (
                  <Link href="/contact" className="flex items-center gap-2.5 hover:text-foreground">
                    <Mail className="h-4 w-4 text-brand-ink" aria-hidden="true" /> Send us a message
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}
