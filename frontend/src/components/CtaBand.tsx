import { ArrowRight, MessageSquare } from "lucide-react";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { OrbitBackground } from "@/components/OrbitBackground";
import { formatMoney, site } from "@/lib/site";

export function CtaBand() {
  return (
    <section className="bg-hero relative overflow-hidden text-white">
      <OrbitBackground />
      <Container className="relative py-20">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to get your business online?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              {formatMoney(site.pricing.setupFee)} once-off to build it, then{" "}
              {formatMoney(site.pricing.monthlyFee)} a month for hosting and support. Tell us about
              your project and our team will take it from there.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/get-started" size="lg">
              Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/contact" variant="outlineInverse" size="lg">
              <MessageSquare className="h-4 w-4" aria-hidden="true" /> Talk to sales
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
