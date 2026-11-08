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

export function formatDate(value?: string | null, fallback = "Not set"): string {
  if (!value) return fallback;
  const date = new Date(value.length > 10 ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
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
      <p className="mt-5 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      <p
        className={`mt-2 flex items-center gap-1.5 text-xs ${
          alert ? "font-medium text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        }`}
      >
        {alert ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
        {note}
      </p>
    </>
  );

  const shell = "rounded-2xl border border-border bg-card p-6";
  if (!href) return <div className={shell}>{body}</div>;
  return (
    <Link href={href} className={`${shell} block transition-colors hover:border-brand/40`}>
      {body}
    </Link>
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
              <th className="pb-3 pr-4 text-right font-semibold">Monthly</th>
              <th className="pb-3 pr-4 text-right font-semibold">Owed</th>
              <th className="pb-3 font-semibold">Next payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.map((client) => (
              <tr key={client.id} className="align-top">
                <td className="py-4 pr-4">
                  <p className="font-medium">{client.company_name}</p>
                  <p className="text-xs text-muted-foreground">{client.contact_email}</p>
                  {client.website_url ? (
                    <a
                      href={client.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-ink hover:underline"
                    >
                      {client.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : null}
                </td>
                <td className="py-4 pr-4">
                  <Pill status={client.status} label={client.status_label} />
                  {client.open_requests > 0 ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {client.open_requests} request{client.open_requests === 1 ? "" : "s"}
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

      {/* Narrow screens: cards, because a table would scroll sideways */}
      <ul className="space-y-3 lg:hidden">
        {clients.map((client) => (
          <li key={client.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{client.company_name}</p>
                <p className="text-xs text-muted-foreground">{client.contact_email}</p>
              </div>
              <Pill status={client.status} label={client.status_label} />
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
  );
}

export function InvoiceTable({
  invoices,
  dateLabel,
  dateOf,
  empty,
}: {
  invoices: StaffInvoice[];
  dateLabel: string;
  dateOf: (invoice: StaffInvoice) => string | null;
  empty: string;
}) {
  if (invoices.length === 0) return <Empty>{empty}</Empty>;

  return (
    <div className="overflow-x-auto">
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
          {invoices.map((invoice) => (
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
                {formatDate(dateOf(invoice), "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
          <p className="mt-2 text-xs text-muted-foreground">
            {request.contact_email} &middot; sent {formatDate(request.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
