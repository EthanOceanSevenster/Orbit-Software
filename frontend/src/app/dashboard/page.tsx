import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/Container";
import { StaffOverview } from "@/components/portal/StaffOverview";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `Every ${site.name} client and where they stand.`,
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <StaffOverview />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <section className="bg-hero py-12 sm:py-16">
        <Container>
          <div className="h-4 w-28 animate-pulse rounded bg-white/15" />
          <div className="mt-3 h-9 w-64 animate-pulse rounded bg-white/15" />
        </Container>
      </section>
      <section className="bg-muted py-12 sm:py-16">
        <Container className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted" />
                <div className="mt-5 h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-8 w-24 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        </Container>
      </section>
    </>
  );
}
