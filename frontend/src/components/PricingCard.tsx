import { ArrowRight, CircleCheck, Plus } from "lucide-react";

import { ButtonLink } from "@/components/Button";
import { formatMoney, site } from "@/lib/site";
import type { AddOn, Plan } from "@/lib/types";

export function PricingCard({
  plan,
  addons = [],
  highlight = false,
}: {
  plan: Plan;
  addons?: AddOn[];
  highlight?: boolean;
}) {
  /*
   * The domain-plus-build breakdown belongs to the website plan, where those
   * two numbers are the whole setup fee. On a plan priced differently it was
   * printing figures that did not add up to the total above them, which is
   * worse than printing nothing, so it only appears when it reconciles.
   */
  const breakdown = site.pricing.domainFee + site.pricing.buildFee;
  const showBreakdown = Number(plan.setup_fee) === breakdown;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xl shadow-slate-900/5 ${
        highlight ? "border-brand" : "border-border"
      }`}
    >
      <div className="h-1.5 bg-gradient-to-r from-brand to-sky-400" />
      <div className="flex flex-1 flex-col p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            {plan.tagline ? (
              <p className="mt-1.5 text-sm text-muted-foreground">{plan.tagline}</p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-ink">
            Hosting included
          </span>
        </div>

        <div className="mt-8 flex items-baseline gap-1.5">
          <span className="text-5xl font-semibold tracking-tight">
            {formatMoney(plan.monthly_fee, plan.currency)}
          </span>
          <span className="text-muted-foreground">/ month</span>
        </div>

        {/* Broken down on purpose. R500 on its own invites "what is the
            catch"; saying that R200 of it is their own domain answers that
            before anyone has to ask, and it is the half we pass on. */}
        <div className="mt-5 rounded-lg bg-muted px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-3 font-semibold">
            <span>Once-off to get started</span>
            <span className="shrink-0">{formatMoney(plan.setup_fee, plan.currency)}</span>
          </div>
          {showBreakdown ? (
            <dl className="mt-2.5 space-y-1.5 border-t border-border pt-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">
                  Your domain, registered in your name
                </dt>
                <dd className="shrink-0">{formatMoney(site.pricing.domainFee)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Designing and building your site</dt>
                <dd className="shrink-0">{formatMoney(site.pricing.buildFee)}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <ButtonLink href={`/get-started?plan=${plan.slug}`} size="lg" className="mt-6 w-full">
          Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          No payment is taken until we have confirmed your project.
        </p>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            What&apos;s included
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {addons.length > 0 ? (
          <div className="mt-7 border-t border-border pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Optional extras
            </p>
            <ul className="mt-4 space-y-3">
              {addons.map((addon) => (
                <li
                  key={addon.slug}
                  className="flex items-start justify-between gap-4 rounded-lg bg-muted px-4 py-3"
                >
                  <span className="flex items-start gap-3 text-sm">
                    <Plus className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
                    <span>
                      <span className="font-medium">{addon.name}</span>
                      {addon.description ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {addon.description}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-sm font-semibold">
                    {formatMoney(addon.monthly_fee, addon.currency)}
                    <span className="font-normal text-muted-foreground"> /mo</span>
                    {Number(addon.setup_fee ?? 0) > 0 ? (
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        + {formatMoney(addon.setup_fee ?? 0, addon.currency)} once-off
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
