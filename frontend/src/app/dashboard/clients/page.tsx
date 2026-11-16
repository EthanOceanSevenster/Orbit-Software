import { Banknote, CirclePause, CircleDollarSign, Clock, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClientsTable, PageHeading, Panel, StatCard } from "@/components/console/parts";
import { Verdict, type VerdictJob } from "@/components/console/Verdict";
import { fetchStaffOverview } from "@/lib/portal";
import { formatMoney } from "@/lib/site";

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

  const active = by.active ?? 0;
  const pending = by.pending ?? 0;
  const resting = (by.paused ?? 0) + (by.cancelled ?? 0);
  const owing = clients.filter((client) => Number(client.outstanding) > 0);

  /*
   * The only thing on this page that needs a decision is somebody signed up
   * with no plan against their name, because that is a client who is not
   * being billed. Money owed is the Payments page's job, so it is mentioned
   * here and linked, not repeated.
   */
  const jobs: VerdictJob[] = [];
  if (pending > 0) {
    jobs.push({
      text: `${pending} ${pending === 1 ? "person is" : "people are"} signed up with no plan yet, so ${
        pending === 1 ? "they are" : "they are"
      } not being billed.`,
      href: "/dashboard/clients/new",
      action: "Add a client",
    });
  }

  const settled = jobs.length === 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          title="Clients"
          lead="Everyone on the books, what they pay you and what they still owe."
        />
        <Link
          href="/dashboard/clients/new"
          className="mb-7 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add a client
        </Link>
      </div>

      {/* The answer first. The numbers underneath are the detail. */}
      <div className="mb-6">
        <Verdict
          settled={settled}
          title={settled ? "Everyone is set up" : "One client still needs setting up"}
          summary={
            settled ? (
              <>
                {active} client{active === 1 ? "" : "s"} paying you, worth{" "}
                {formatMoney(totals.monthly_recurring, currency)} a month between them.
                {owing.length > 0
                  ? ` ${owing.length} of them still ${
                      owing.length === 1 ? "has" : "have"
                    } ${formatMoney(totals.outstanding, currency)} to pay.`
                  : " Nobody owes you anything."}
              </>
            ) : undefined
          }
          jobs={jobs}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Clients paying you"
          value={String(active)}
          note={
            pending > 0 ? `${pending} more waiting to be set up` : "Everyone is live and billing"
          }
        />
        <StatCard
          icon={Banknote}
          label="Money every month"
          value={formatMoney(totals.monthly_recurring, currency)}
          note="Their plans and add-ons added up"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Owing you right now"
          value={formatMoney(totals.outstanding, currency)}
          note={
            totals.unpaid_invoices > 0
              ? `${totals.unpaid_invoices} invoice${
                  totals.unpaid_invoices === 1 ? "" : "s"
                } not paid yet`
              : "Every invoice has been settled"
          }
          alert={totals.overdue_invoices > 0}
          href="/dashboard/payments"
        />
        <StatCard
          icon={pending > 0 ? Clock : CirclePause}
          label={pending > 0 ? "Waiting to be set up" : "Paused or ended"}
          value={String(pending > 0 ? pending : resting)}
          note={
            pending > 0
              ? "Signed up, no plan against their name"
              : resting > 0
                ? "Not being billed"
                : "Nobody has left"
          }
          alert={pending > 0}
        />
      </div>

      <div className="mt-6">
        <Panel
          title="Everyone"
          action={
            <p className="text-sm text-muted-foreground">
              {clients.length} {clients.length === 1 ? "client" : "clients"}
            </p>
          }
        >
          <ClientsTable clients={clients} />
        </Panel>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        Use <span className="font-medium text-foreground">Add a client</span> above to put
        someone new on a plan. To change a plan, pause an account or move a payment date for
        someone already here, open Client accounts in the admin area &mdash; this page shows
        the change straight away.
      </p>
    </>
  );
}
