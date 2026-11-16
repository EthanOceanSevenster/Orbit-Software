import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { TERMS } from "@/lib/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: `What ${site.name} does, what it costs, who owns what, and how either side can end it.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of service"
      lead="What we do, what it costs, who owns what, and how either of us can end it. Written to be read."
      sections={TERMS}
    />
  );
}
