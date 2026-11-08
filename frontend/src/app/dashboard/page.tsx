import { Banknote, CircleDollarSign, Inbox, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ClientsTable,
  InvoiceTable,
  PageHeading,
  Panel,
  RequestsList,
  StatCard,
} from "@/components/console/parts";
import { fetchStaffOverview } from "@/lib/portal";
import { formatMoney } from "@/lib/site";

// Per-request, like the rest of the console. See the note in layout.tsx.
export const instant = false;

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

export default async function OverviewPage() {
  const result = await fetchStaffOverview();
  if (!result.ok) redirect(result.status === 403 ? "/account" : "/login");

  const { totals, clients, requests, payments } = result.data;
  const currency = totals.currency ?? "ZAR";

  return (
    <>
      <PageHeading
        title="Overview"
        lead="How the business stands today: who is on the books, what has come in, and who is waiting on you."
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Clients"
          value={String(totals.clients)}
          note={`${totals.by_status.active ?? 0} active, ${totals.by_status.pending ?? 0} pending`}
          href="/dashboard/clients"
        />
        <StatCard
          icon={Banknote}
          label="Paid this month"
          value={formatMoney(totals.received_this_month, currency)}
          note={`${formatMoney(totals.received_total, currency)} received in total`}
          href="/dashboard/payments"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Owed to you"
          value={formatMoney(totals.outstanding, currency)}
          note={
            totals.overdue_invoices > 0
              ? `${totals.overdue_invoices} overdue`
              : "Nothing overdue"
          }
          alert={totals.overdue_invoices > 0}
          href="/dashboard/payments"
        />
        <StatCard
          icon={Inbox}
          label="Requests"
          value={String(totals.open_requests)}
          note={totals.open_requests > 0 ? "Waiting on you" : "All answered"}
          alert={totals.open_requests > 0}
          href="/dashboard/requests"
        />
      </div>

      <div className="mt-6 space-y-6">
        <Panel
          title="Expected every month"
          action={
            <p className="text-2xl font-semibold tracking-tight">
              {formatMoney(totals.monthly_recurring, currency)}
            </p>
          }
        >
          <p className="text-sm text-muted-foreground">
            The total of every active client&rsquo;s plan and add-ons. Paused and pending
            accounts are left out, because they are not paying.
          </p>
        </Panel>

        {requests.length > 0 ? (
          <Panel
            title="Waiting on you"
            action={
              <Link
                href="/dashboard/requests"
                className="text-sm font-semibold text-brand-ink hover:underline"
              >
                See all
              </Link>
            }
          >
            <RequestsList requests={requests.slice(0, 3)} />
          </Panel>
        ) : null}

        <Panel
          title="Recent payments"
          action={
            <Link
              href="/dashboard/payments"
              className="text-sm font-semibold text-brand-ink hover:underline"
            >
              See all
            </Link>
          }
        >
          <InvoiceTable
            invoices={payments.slice(0, 5)}
            dateLabel="Paid"
            dateOf={(invoice) => invoice.paid_at}
            empty="Nothing has been paid yet. Settled invoices appear here."
          />
        </Panel>

        <Panel
          title="Clients"
          action={
            <Link
              href="/dashboard/clients"
              className="text-sm font-semibold text-brand-ink hover:underline"
            >
              See all
            </Link>
          }
        >
          <ClientsTable clients={clients.slice(0, 5)} />
        </Panel>
      </div>
    </>
  );
}
