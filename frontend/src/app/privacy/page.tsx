import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { PRIVACY } from "@/lib/legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `What ${site.name} collects, why, who else sees it and how long it is kept. Written to meet POPIA.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy notice"
      lead="What we collect, why we have it, who else sees it and how long we keep it."
      sections={PRIVACY}
    />
  );
}
