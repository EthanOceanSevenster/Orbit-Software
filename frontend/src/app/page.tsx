import { Suspense } from "react";

import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Faq } from "@/components/Faq";
import { Hero } from "@/components/Hero";
import { IconBadgeDark, IconRow, IconTile } from "@/components/IconTile";
import { Journey, NextStep } from "@/components/Journey";
import { OrbitBackground } from "@/components/OrbitBackground";
import { PlainAnswer } from "@/components/PlainAnswer";
import { PlanCards, PlanCardsSkeleton } from "@/components/PlanCards";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceCard } from "@/components/ServiceCard";
import { TrustBar } from "@/components/TrustBar";
import { CAPABILITIES, INDUSTRIES, SERVICES, WHY_US } from "@/lib/content";
import { site } from "@/lib/site";

/**
 * The page is ordered as one journey:
 *   1. Hero          who we are and what it costs
 *   2. TrustBar      quick reassurance
 *   3. PlainAnswer   what we actually do, in three lines
 *   4. Journey       how it works, and who does what
 *   5. Services      the detail
 *   6. Pricing       the plan
 *   7. Industries    is this for me?
 *   8. Why Orbit     why us
 *   9. FAQ           anything left
 *  10. CTA           act
 * Each long section ends with a link onward, so there is never a dead end.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <PlainAnswer />
      <Journey />

      {/* What is included */}
      <section id="services" className="relative py-20 sm:py-28">
        <div className="bg-dots pointer-events-none absolute inset-0" aria-hidden="true" />
        <Container className="relative">
          <SectionHeading
            eyebrow="What we do"
            title="Everything your website needs, from one team"
            text="You deal with one company and one monthly fee, instead of a designer, a host and a support company."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          <NextStep href="/services" label="Read about each service" />
        </Container>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-muted py-20 sm:py-28">
        <Container className="grid items-start gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading
              align="left"
              eyebrow="Pricing"
              title="One plan. Everything included."
              text="A once-off setup fee to design and build your site, then one flat monthly fee for hosting, security and support."
            />
            <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {CAPABILITIES.map((item) => (
                <IconRow key={item.title} {...item} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <Suspense fallback={<PlanCardsSkeleton />}>
              <PlanCards />
            </Suspense>
          </div>
        </Container>
      </section>

      {/* Industries */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading
            eyebrow="Who we work with"
            title="Built for businesses like yours"
            text="Whatever your industry, we build a website that explains what you do and makes it easy for customers to get in touch."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((item) => (
              <IconTile key={item.title} {...item} />
            ))}
          </div>
          <NextStep href="/contact" label="Not sure if we fit? Ask us" />
        </Container>
      </section>

      {/* Why Orbit */}
      <section id="why-orbit" className="relative overflow-hidden py-20 text-white sm:py-28">
        <OrbitBackground focus="center" />
        <Container className="relative">
          <SectionHeading
            invert
            eyebrow={`Why ${site.name.split(" ")[0]}`}
            title="A software company, not a template shop"
            text="We bring engineering discipline to every website we build, then stay with you for the long run."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {WHY_US.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-8 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
              >
                <IconBadgeDark icon={item.icon} />
                <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
          <div className="mt-12">
            <Faq />
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
