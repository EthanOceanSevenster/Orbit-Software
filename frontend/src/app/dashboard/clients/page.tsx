import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ClientsTable, PageHeading, Panel, StatCard } from "@/components/console/parts";
import { fetchStaffOverview } from "@/lib/portal";
import { formatMoney } from "@/lib/site";
import { CircleCheck, CirclePause, Clock, Users } from "lucide-react";

// Per-request, like the rest of the console. See the note in layout.tsx.
export const instant = false;

export const metadata: Metadata = {
  title: "Clients",
  robots: { index: false, follow: false },
};

export default async function ClientsPage() {
  const result = await fetchStaffOverview();
  if (!result.ok) redirect(result.status === 403 ? "/account" : "/login");

  const { totals, clients } = result.data;
  const currency = totals.currency ?? "ZAR";
  const by = totals.by_status;

  return (
    <>
      <PageHeading
        title="Clients"
        lead="Everyone on the books, what they are on and what they owe."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Everyone"
          value={String(totals.clients)}
          note={`${formatMoney(totals.monthly_recurring, currency)} a month expected`}
        />
        <StatCard
          icon={CircleCheck}
          label="Active"
          value={String(by.active ?? 0)}
          note="Paying and live"
        />
        <StatCard
          icon={Clock}
          label="Pending setup"
          value={String(by.pending ?? 0)}
          note={
            (by.pending ?? 0) > 0
              ? "Signed up, waiting on a plan"
              : "Nobody waiting to be set up"
          }
          alert={(by.pending ?? 0) > 0}
        />
        <StatCard
          icon={CirclePause}
          label="Paused or ended"
          value={String((by.paused ?? 0) + (by.cancelled ?? 0))}
          note="Not billed"
        />
      </div>

      <div className="mt-6">
        <Panel title="Everyone">
          <ClientsTable clients={clients} />
        </Panel>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        To put someone on a plan, change their status or set a payment date, open
        Client accounts in the Django admin. This page reflects it straight away.
      </p>
    </>
  );
}
