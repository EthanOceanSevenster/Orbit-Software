import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { LEGAL_UPDATED, type LegalSection } from "@/lib/legal";
import { publicEmail, site } from "@/lib/site";

/**
 * One layout for terms, privacy and refunds.
 *
 * Narrow measure, generous line height, real headings. A policy is read by
 * somebody who is worried, often on a phone, and the usual wall of grey
 * eight-point text is how a business signals it would rather you did not.
 */
export function LegalPage({
  eyebrow,
  title,
  lead,
  sections,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} text={lead} />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl">
            <p className="text-sm text-muted-foreground">Last updated {LEGAL_UPDATED}</p>

            <div className="mt-10 space-y-10">
              {sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
                  <div className="mt-3 space-y-3">
                    {section.body.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 32)}
                        className="leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-semibold">Getting hold of us</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {site.legalName}, a sole proprietorship in {site.location}.
                {publicEmail ? ` Email ${publicEmail}, or send` : " Send"} a message
                through the contact form and we reply by email, usually the same day.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline"
              >
                Contact us
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
