import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  ExternalLink,
  Inbox,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { IconBadge } from "@/components/IconTile";
import { LogoutButton } from "@/components/portal/LogoutButton";
import { fetchStaffOverview } from "@/lib/portal";
import { formatMoney } from "@/lib/site";
import type { StaffClient, StaffServiceRequest } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  paused: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  cancelled: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

function formatDate(value?: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value.length > 10 ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] ?? STATUS_STYLES.cancelled
      }`}
    >
      {label}
    </span>
  );
}

export async function StaffOverview() {
  const result = await fetchStaffOverview();
  if (!result.ok) {
    // 403 means a signed-in client reached this page. Their own account is
    // where they belong. Anything else means no session at all.
    redirect(result.status === 403 ? "/account" : "/login");
  }

  const { totals, clients, requests } = result.data;
  const currency = totals.currency ?? "ZAR";

  return (
    <>
      <section className="bg-hero relative overflow-hidden text-white">
        <Container className="relative py-12 sm:py-16">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sky-300">
                Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Your clients
              </h1>
              <p className="mt-3 max-w-xl text-slate-300">
                Everyone on the books, what they pay and what they are waiting on.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ButtonLink href="/account" variant="outlineInverse" size="sm">
                My account
              </ButtonLink>
              <LogoutButton />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-muted py-12 sm:py-16">
        <Container className="space-y-6">
          {/* The numbers that matter */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Clients"
              value={String(totals.clients)}
              note={`${totals.by_status.active ?? 0} active, ${totals.by_status.pending ?? 0} pending`}
            />
            <StatCard
              icon={Banknote}
              label="Every month"
              value={formatMoney(totals.monthly_recurring, currency)}
              note="From active clients"
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
            />
            <StatCard
              icon={Inbox}
              label="Requests"
              value={String(totals.open_requests)}
              note={totals.open_requests > 0 ? "Waiting on you" : "All answered"}
              alert={totals.open_requests > 0}
            />
          </div>

          {/* Requests waiting */}
          {requests.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-7 sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Inbox className="h-5 w-5 text-brand-ink" aria-hidden="true" />
                Waiting on you
              </h2>
              <ul className="mt-5 space-y-3">
                {requests.map((request: StaffServiceRequest) => (
                  <li
                    key={request.id}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium">
                        {request.company_name}
                        <span className="text-muted-foreground"> wants </span>
                        {request.service_label}
                      </p>
                      <StatusPill status="pending" label={request.status_label} />
                    </div>
                    {request.details ? (
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {request.details}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {request.contact_email} &middot; sent {formatDate(request.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                Change a request&rsquo;s status in the admin and the client sees it on
                their own page.
              </p>
            </div>
          ) : null}

          {/* Everyone */}
          <div className="rounded-2xl border border-border bg-card p-7 sm:p-8">
            <h2 className="text-lg font-semibold">Everyone</h2>

            {clients.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No clients yet. They appear here as soon as someone signs up or you
                add them in the admin.
              </p>
            ) : (
              <>
                {/* Wide screens: a table reads fastest */}
                <div className="mt-5 hidden overflow-x-auto lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="pb-3 pr-4 font-semibold">Client</th>
                        <th className="pb-3 pr-4 font-semibold">Status</th>
                        <th className="pb-3 pr-4 font-semibold">Plan</th>
                        <th className="pb-3 pr-4 text-right font-semibold">Monthly</th>
                        <th className="pb-3 pr-4 text-right font-semibold">Owed</th>
                        <th className="pb-3 font-semibold">Next payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {clients.map((client: StaffClient) => (
                        <tr key={client.id} className="align-top">
                          <td className="py-4 pr-4">
                            <p className="font-medium">{client.company_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {client.contact_email}
                            </p>
                            {client.website_url ? (
                              <a
                                href={client.website_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-ink hover:underline"
                              >
                                {client.website_url
                                  .replace(/^https?:\/\//, "")
                                  .replace(/\/$/, "")}
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            ) : null}
                          </td>
                          <td className="py-4 pr-4">
                            <StatusPill status={client.status} label={client.status_label} />
                            {client.open_requests > 0 ? (
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                {client.open_requests} request
                                {client.open_requests === 1 ? "" : "s"}
                              </p>
                            ) : null}
                          </td>
                          <td className="py-4 pr-4 text-muted-foreground">
                            {client.plan_name || "No plan"}
                          </td>
                          <td className="py-4 pr-4 text-right font-medium">
                            {formatMoney(client.monthly_total, client.currency)}
                          </td>
                          <td className="py-4 pr-4 text-right">
                            {Number(client.outstanding) > 0 ? (
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                {formatMoney(client.outstanding, client.currency)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">&mdash;</span>
                            )}
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {formatDate(client.next_payment_date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Narrow screens: a table would need sideways scrolling */}
                <ul className="mt-5 space-y-3 lg:hidden">
                  {clients.map((client: StaffClient) => (
                    <li
                      key={client.id}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{client.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.contact_email}
                          </p>
                        </div>
                        <StatusPill status={client.status} label={client.status_label} />
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Monthly</dt>
                          <dd className="font-medium">
                            {formatMoney(client.monthly_total, client.currency)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Owed</dt>
                          <dd className="font-medium">
                            {Number(client.outstanding) > 0
                              ? formatMoney(client.outstanding, client.currency)
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Plan</dt>
                          <dd>{client.plan_name || "No plan"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Next payment</dt>
                          <dd>{formatDate(client.next_payment_date)}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  alert = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <IconBadge icon={icon} />
      <p className="mt-5 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      <p
        className={`mt-2 flex items-center gap-1.5 text-xs ${
          alert ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        }`}
      >
        {alert ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {note}
      </p>
    </div>
  );
}
