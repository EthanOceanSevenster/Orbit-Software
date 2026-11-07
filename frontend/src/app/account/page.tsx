import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/Container";
import { AccountOverview } from "@/components/portal/AccountOverview";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your account",
  description: `Your ${site.name} account.`,
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountOverview />
    </Suspense>
  );
}

function AccountSkeleton() {
  return (
    <>
      <section className="bg-hero py-12 sm:py-16">
        <Container>
          <div className="h-4 w-28 animate-pulse rounded bg-white/15" />
          <div className="mt-3 h-9 w-72 animate-pulse rounded bg-white/15" />
        </Container>
      </section>
      <section className="bg-muted py-12 sm:py-16">
        <Container className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-7">
              <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted" />
              <div className="mt-6 h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-9 w-32 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
