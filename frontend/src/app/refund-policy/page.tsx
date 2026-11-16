import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { REFUNDS } from "@/lib/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund policy",
  description: `When ${site.name} refunds a setup fee, a build, a monthly fee or once-off work, and how the money comes back.`,
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Refunds"
      title="Refund policy"
      lead="When money comes back, when it does not, and why. No small print."
      sections={REFUNDS}
    />
  );
}
