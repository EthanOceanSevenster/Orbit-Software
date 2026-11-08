import { AlertTriangle, Banknote, CircleDollarSign, Receipt } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InvoiceTable, PageHeading, Panel, StatCard } from "@/components/console/parts";
import { fetchStaffOverview } from "@/lib/portal";
import { formatMoney } from "@/lib/site";

// Per-request, like the rest of the console. See the note in layout.tsx.
export const instant = false;

export const metadata: Metadata = {
  title: "Payments",
  robots: { index: false, follow: false },
};

export default async function PaymentsPage() {
  const result = await fetchStaffOverview();
  if (!result.ok) redirect(result.status === 403 ? "/account" : "/login");

  const { totals, payments, unpaid } = result.data;
  const currency = totals.currency ?? "ZAR";

  return (
    <>
      <PageHeading
        title="Payments"
        lead="What has actually come in, and what is still owed. Money received is not the same as money billed."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Paid this month"
          value={formatMoney(totals.received_this_month, currency)}
          note="Since the first of the month"
        />
        <StatCard
          icon={Receipt}
          label="Received in total"
          value={formatMoney(totals.received_total, currency)}
          note={`Across ${totals.payments_count} invoice${totals.payments_count === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={CircleDollarSign}
          label="Still owed"
          value={formatMoney(totals.outstanding, currency)}
          note={`${totals.unpaid_invoices} unpaid invoice${totals.unpaid_invoices === 1 ? "" : "s"}`}
          alert={Number(totals.outstanding) > 0}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={String(totals.overdue_invoices)}
          note={
            totals.overdue_invoices > 0 ? "Past the due date" : "Nothing past its due date"
          }
          alert={totals.overdue_invoices > 0}
        />
      </div>

      <div className="mt-6 space-y-6">
        <Panel title="Still to be paid">
          <InvoiceTable
            invoices={unpaid}
            dateLabel="Due"
            dateOf={(invoice) => invoice.due_on}
            empty="Nothing outstanding. Every invoice raised has been settled."
          />
        </Panel>

        <Panel title="Payments received">
          <InvoiceTable
            invoices={payments}
            dateLabel="Paid"
            dateOf={(invoice) => invoice.paid_at}
            empty="Nothing has been paid yet. Settled invoices appear here with the date."
          />
        </Panel>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        An invoice is only marked paid after the payment is confirmed with the provider,
        so these figures are what reached you, not what was promised. Raise and edit
        invoices under Invoices in the Django admin.
      </p>
    </>
  );
}
