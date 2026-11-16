import { AlertTriangle, Banknote, CircleDollarSign, Receipt } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  InvoiceTable,
  PageHeading,
  Panel,
  StatCard,
  dueIn,
  formatDate,
} from "@/components/console/parts";
import { Verdict, type VerdictJob } from "@/components/console/Verdict";
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

  const late = unpaid.filter((invoice) => invoice.status === "overdue");
  const lateTotal = late.reduce((sum, invoice) => sum + Number(invoice.amount), 0);

  /*
   * The soonest thing that has to happen, named. "Due 22 Nov 2026" is a date
   * you have to work out; "the next one on 22 Nov, in 6 days" is a plan.
   */
  const nextDue = [...unpaid]
    .filter((invoice) => invoice.due_on)
    .sort((a, b) => a.due_on.localeCompare(b.due_on))[0];

  const jobs: VerdictJob[] = [];
  if (late.length > 0) {
    jobs.push({
      text: `${late.length} invoice${late.length === 1 ? " is" : "s are"} past the due date, ${formatMoney(
        lateTotal,
        currency,
      )} in total. Send ${late.length === 1 ? "that client" : "those clients"} a reminder.`,
    });
  }

  const settled = jobs.length === 0;

  return (
    <>
      <PageHeading
        title="Payments"
        lead="What has actually reached you, and what is still coming. Money billed is not money received."
      />

      {/* The answer first. The numbers underneath are the detail. */}
      <div className="mb-6">
        <Verdict
          settled={settled}
          title={settled ? "Nothing is late" : "Someone is late paying you"}
          summary={
            settled ? (
              totals.unpaid_invoices > 0 ? (
                <>
                  {formatMoney(totals.outstanding, currency)} is still to come in across{" "}
                  {totals.unpaid_invoices} invoice
                  {totals.unpaid_invoices === 1 ? "" : "s"}, and every one of them is still
                  inside its due date.
                  {nextDue
                    ? ` The next is ${nextDue.company_name}, ${formatMoney(
                        nextDue.amount,
                        nextDue.currency,
                      )} on ${formatDate(nextDue.due_on)} (${dueIn(nextDue.due_on)}).`
                    : ""}
                </>
              ) : (
                <>Every invoice you have raised has been paid. Nothing is outstanding.</>
              )
            ) : undefined
          }
          jobs={jobs}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        <StatCard
          icon={Banknote}
          label="Money in this month"
          value={formatMoney(totals.received_this_month, currency)}
          note="Since the first of this month"
        />
        <StatCard
          icon={Receipt}
          label="Money in altogether"
          value={formatMoney(totals.received_total, currency)}
          note={
            totals.payments_count > 0
              ? `${totals.payments_count} invoice${
                  totals.payments_count === 1 ? "" : "s"
                } paid so far`
              : "Nothing has been paid yet"
          }
        />
        <StatCard
          icon={CircleDollarSign}
          label="Still to be paid"
          value={formatMoney(totals.outstanding, currency)}
          note={
            totals.unpaid_invoices > 0
              ? `${totals.unpaid_invoices} invoice${
                  totals.unpaid_invoices === 1 ? "" : "s"
                } waiting to be paid`
              : "Nothing is outstanding"
          }
        />
        <StatCard
          icon={AlertTriangle}
          label="Late"
          value={String(totals.overdue_invoices)}
          note={
            totals.overdue_invoices > 0
              ? `${formatMoney(lateTotal, currency)} past the due date`
              : "Nothing is past its due date"
          }
          alert={totals.overdue_invoices > 0}
        />
      </div>

      <div className="mt-6 space-y-6">
        <Panel
          title="Waiting to be paid"
          action={
            unpaid.length > 0 ? (
              <p className="text-sm font-semibold">
                {formatMoney(totals.outstanding, currency)}
              </p>
            ) : null
          }
        >
          <InvoiceTable
            invoices={unpaid}
            dateLabel="Due"
            dateOf={(invoice) => invoice.due_on}
            countdown
            empty="Nothing outstanding. Every invoice you have raised has been settled."
          />
        </Panel>

        <Panel
          title="Already paid"
          action={
            payments.length > 0 ? (
              <p className="text-sm font-semibold">
                {formatMoney(totals.received_total, currency)}
              </p>
            ) : null
          }
        >
          <InvoiceTable
            invoices={payments}
            dateLabel="Paid"
            dateOf={(invoice) => invoice.paid_at}
            empty="Nothing has been paid yet. Once a payment clears, the invoice moves here with the date it arrived."
          />
        </Panel>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        An invoice only moves to <span className="font-medium text-foreground">Already paid</span>{" "}
        once the payment is confirmed with the provider, so these figures are what reached
        you, not what was promised. Raise or change an invoice under Invoices in the admin
        area &mdash; this page shows it straight away.
      </p>
    </>
  );
}
