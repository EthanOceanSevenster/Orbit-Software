import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/PageHeader";
import { WorkShowcase } from "@/components/WorkShowcase";
import { CLIENT_SITES } from "@/lib/clients";

export const metadata: Metadata = {
  title: "Our work",
  description:
    "Websites we have built and still host for South African businesses. Live sites you can click into, not mock-ups.",
};

export default function WorkPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our work"
        title="Sites we have built and still run"
        text={`${CLIENT_SITES.length} live businesses, online right now, hosted and maintained by us. Click through and judge them yourself.`}
      />

      <section className="py-20 sm:py-28">
        <Container>
          <WorkShowcase />
          <p className="mt-12 text-center text-muted-foreground">
            Want to see how one was put together?{" "}
            <Link
              href={`/work/${CLIENT_SITES[0].slug}`}
              className="inline-flex items-center gap-1.5 font-semibold text-brand-ink hover:underline"
            >
              Read a case study
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </p>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
