import { AlertTriangle, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { IconBadge } from "@/components/IconTile";
import { formatMoney } from "@/lib/site";
import type { StaffClient, StaffInvoice, StaffServiceRequest } from "@/lib/types";

const ACCOUNT_STATUS: Record<string, string> = {
  pending: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  paused: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  cancelled: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

const INVOICE_STATUS: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  due: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-300",
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  void: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

const REQUEST_STATUS: Record<string, string> = {
  new: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  quoted: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  accepted: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  declined: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value.length > 10 ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string | null, fallback = "Not set"): string {
  const date = parseDate(value);
  if (!date) return value || fallback;
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * A due date said the way a person would say it.
 *
 * "22 Nov 2026" makes you count on your fingers. "In 6 days" does not, and
 * "5 days late" is the only version of it that produces a phone call.
 */
export function dueIn(value?: string | null): string | null {
  const due = parseDate(value);
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "1 day late";
  return `${Math.abs(days)} days late`;
}

export function Pill({
  status,
  label,
  kind = "account",
}: {
  status: string;
  label: string;
  kind?: "account" | "invoice" | "request";
}) {
  const map =
    kind === "invoice" ? INVOICE_STATUS : kind === "request" ? REQUEST_STATUS : ACCOUNT_STATUS;
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        map[status] ?? map.draft ?? ACCOUNT_STATUS.cancelled
      }`}
    >
      {label}
    </span>
  );
}

export function PageHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1.5 max-w-2xl text-muted-foreground">{lead}</p>
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

export function StatCard({
  icon,
  label,
  value,
  note,
  alert = false,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  alert?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <IconBadge icon={icon} />
      <p className="mt-4 text-sm text-muted-foreground sm:mt-5">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
      <p
        className={`mt-2 flex items-start gap-1.5 text-xs leading-relaxed ${
          alert ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        }`}
      >
        {alert ? (
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : null}
        {note}
      </p>
    </>
  );

  const shell = "rounded-2xl border border-border bg-card p-5 sm:p-6";
  if (!href) return <div className={shell}>{body}</div>;
  return (
    <Link href={href} className={`${shell} block transition-colors hover:border-brand/40`}>
      {body}
    </Link>
  );
}

function WebsiteLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-ink hover:underline"
    >
      {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
    </a>
  );
}

export function ClientsTable({ clients }: { clients: StaffClient[] }) {
  if (clients.length === 0) {
    return (
      <Empty>
        No clients yet. They appear here as soon as someone signs up or you add them in
        the admin.
      </Empty>
    );
  }

  return (
    <>
      {/* Wide screens read a table fastest */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="pb-3 pr-4 font-semibold">Client</th>
              <th className="pb-3 pr-4 font-semibold">Status</th>
              <th className="pb-3 pr-4 font-semibold">Plan</th>
              <th className="pb-3 pr-4 text-right font-semibold">Pays a month</th>
              <th className="pb-3 pr-4 text-right font-semibold">Owes you</th>
              <th className="pb-3 font-semibold">Next payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.map((client) => (
              <tr key={client.id} className="align-top">
                <td className="py-4 pr-4">
                  <p className="font-medium">{client.company_name}</p>
                  <p className="text-xs text-muted-foreground">{client.contact_email}</p>
                  {client.website_url ? <WebsiteLink url={client.website_url} /> : null}
                </td>
                <td className="py-4 pr-4">
                  <Pill status={client.status} label={client.status_label} />
                  {client.open_requests > 0 ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Asking for {client.open_requests} thing
                      {client.open_requests === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </td>
                <td className="py-4 pr-4 text-muted-foreground">
                  {client.plan_name || "No plan yet"}
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
                    <span className="text-muted-foreground">Nothing</span>
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

      {/* Narrow screens: cards, because a table would scroll sideways */}
      <ul className="space-y-3 lg:hidden">
        {clients.map((client) => (
          <li key={client.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{client.company_name}</p>
                <p className="break-all text-xs text-muted-foreground">
                  {client.contact_email}
                </p>
                {client.website_url ? <WebsiteLink url={client.website_url} /> : null}
              </div>
              <span className="shrink-0">
                <Pill status={client.status} label={client.status_label} />
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Pays a month</dt>
                <dd className="font-medium">
                  {formatMoney(client.monthly_total, client.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Owes you</dt>
                <dd
                  className={
                    Number(client.outstanding) > 0
                      ? "font-semibold text-amber-600 dark:text-amber-400"
                      : "font-medium"
                  }
                >
                  {Number(client.outstanding) > 0
                    ? formatMoney(client.outstanding, client.currency)
                    : "Nothing"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Plan</dt>
                <dd>{client.plan_name || "No plan yet"}</dd>
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
  );
}

export function InvoiceTable({
  invoices,
  dateLabel,
  dateOf,
  empty,
  countdown = false,
}: {
  invoices: StaffInvoice[];
  dateLabel: string;
  dateOf: (invoice: StaffInvoice) => string | null;
  empty: string;
  /** Adds "in 6 days" or "5 days late" under the date. Only means anything for a due date. */
  countdown?: boolean;
}) {
  if (invoices.length === 0) return <Empty>{empty}</Empty>;

  return (
    <>
      {/* Wide screens read a table fastest */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="pb-3 pr-4 font-semibold">Invoice</th>
              <th className="pb-3 pr-4 font-semibold">Client</th>
              <th className="pb-3 pr-4 text-right font-semibold">Amount</th>
              <th className="pb-3 pr-4 font-semibold">Status</th>
              <th className="pb-3 font-semibold">{dateLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((invoice) => {
              const when = dateOf(invoice);
              const soon = countdown ? dueIn(when) : null;
              const late = invoice.status === "overdue";
              return (
                <tr key={invoice.id} className="align-top">
                  <td className="py-3.5 pr-4">
                    <p className="font-medium">{invoice.number}</p>
                    {invoice.description ? (
                      <p className="text-xs text-muted-foreground">{invoice.description}</p>
                    ) : null}
                  </td>
                  <td className="py-3.5 pr-4">{invoice.company_name}</td>
                  <td className="py-3.5 pr-4 text-right font-medium">
                    {formatMoney(invoice.amount, invoice.currency)}
                  </td>
                  <td className="py-3.5 pr-4">
                    <Pill status={invoice.status} label={invoice.status_label} kind="invoice" />
                  </td>
                  <td className="py-3.5 text-muted-foreground">
                    {formatDate(when, "—")}
                    {soon ? (
                      <span
                        className={`block text-xs ${
                          late ? "font-medium text-red-600 dark:text-red-400" : ""
                        }`}
                      >
                        {soon}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Narrow screens: cards. Five columns on a phone is a sideways scroll,
          and nobody scrolls a table sideways to find out who owes them money. */}
      <ul className="space-y-3 lg:hidden">
        {invoices.map((invoice) => {
          const when = dateOf(invoice);
          const soon = countdown ? dueIn(when) : null;
          const late = invoice.status === "overdue";
          return (
            <li key={invoice.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{invoice.company_name}</p>
                  {invoice.description ? (
                    <p className="text-xs text-muted-foreground">{invoice.description}</p>
                  ) : null}
                </div>
                <p className="shrink-0 whitespace-nowrap text-lg font-semibold tracking-tight">
                  {formatMoney(invoice.amount, invoice.currency)}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border pt-3">
                <Pill status={invoice.status} label={invoice.status_label} kind="invoice" />
                <p className="text-xs text-muted-foreground">
                  {dateLabel} {formatDate(when, "—")}
                  {soon ? (
                    <span className={late ? "font-medium text-red-600 dark:text-red-400" : ""}>
                      {" · "}
                      {soon}
                    </span>
                  ) : null}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{invoice.number}</p>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function RequestsList({ requests }: { requests: StaffServiceRequest[] }) {
  if (requests.length === 0) {
    return <Empty>Nothing waiting. Requests clients send you land here.</Empty>;
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <li key={request.id} className="rounded-xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium">
              {request.company_name}
              <span className="text-muted-foreground"> wants </span>
              {request.service_label}
            </p>
            <Pill status={request.status} label={request.status_label} kind="request" />
          </div>
          {request.details ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {request.details}
            </p>
          ) : null}
          <p className="mt-2 break-all text-xs text-muted-foreground">
            {request.contact_email} &middot; sent {formatDate(request.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
