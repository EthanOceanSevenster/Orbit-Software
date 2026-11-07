import { ArrowRight, CircleCheck } from "lucide-react";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { IconBadge } from "@/components/IconTile";
import { PageHeader } from "@/components/PageHeader";
import { SERVICES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Website design and build, managed hosting, ongoing updates and support, and custom software from one team.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="One team for your whole web presence"
        text="We build your website, host it, keep it secure and help it grow. When you need custom software, we build that too."
      >
        <nav aria-label="Services on this page" className="mt-8 flex flex-wrap gap-2">
          {SERVICES.map((service) => (
            <a
              key={service.id}
              href={`#${service.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/10"
            >
              <service.icon className="h-4 w-4 text-sky-300" aria-hidden="true" />
              {service.title}
            </a>
          ))}
        </nav>
      </PageHeader>

      <section className="bg-muted py-20 sm:py-24">
        <Container className="space-y-6">
          {SERVICES.map((service) => (
            <article
              id={service.id}
              key={service.id}
              className="grid gap-10 rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10 lg:grid-cols-2 lg:items-center"
            >
              <div>
                <div className="flex items-center gap-3">
                  <IconBadge icon={service.icon} size="lg" />
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      service.included
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {service.included ? "Included in your plan" : "Quoted separately"}
                  </span>
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{service.title}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{service.summary}</p>
                <ButtonLink
                  href={service.included ? "/get-started" : "/contact"}
                  variant="ghost"
                  className="-ml-3 mt-6"
                >
                  {service.included ? "Get started" : "Request a quote"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {service.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-3 rounded-lg bg-muted p-4 text-sm">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
