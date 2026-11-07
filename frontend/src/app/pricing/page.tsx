import { ArrowRight, CodeXml } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { IconBadge, IconTile } from "@/components/IconTile";
import { PageHeader } from "@/components/PageHeader";
import { PlanCards, PlanCardsSkeleton } from "@/components/PlanCards";
import { SectionHeading } from "@/components/SectionHeading";
import { CAPABILITIES } from "@/lib/content";
import { formatMoney, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${formatMoney(site.pricing.setupFee)} once-off setup and ${formatMoney(site.pricing.monthlyFee)} per month for a professionally built and hosted website.`,
};

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        text={`A once-off ${formatMoney(site.pricing.setupFee)} setup fee to design and build your site, then ${formatMoney(site.pricing.monthlyFee)} per month for hosting, security and support.`}
      />

      <section className="bg-muted py-20 sm:py-24">
        <Container>
          <Suspense fallback={<PlanCardsSkeleton />}>
            <PlanCards />
          </Suspense>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Included"
            title="Everything in your plan"
            text="No add-ons to work out and no separate hosting bill. Every website comes with all of this."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
              <IconTile key={item.title} {...item} />
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="flex gap-5">
              <IconBadge icon={CodeXml} size="lg" />
              <div>
                <h2 className="text-xl font-semibold">Need something bigger?</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Online stores, customer portals, integrations and custom software are scoped and
                  quoted separately. Tell us what you have in mind and we will put together a
                  proposal.
                </p>
              </div>
            </div>
            <ButtonLink href="/contact" variant="secondary" className="shrink-0">
              Request a quote <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-muted py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="FAQ" title="Pricing questions" />
          <div className="mt-12">
            <Faq />
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
