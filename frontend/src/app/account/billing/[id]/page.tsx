import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { InvoicePrintButton } from "@/components/portal/InvoicePrintButton";
import { fetchMyInvoice } from "@/lib/portal";
import { formatMoney } from "@/lib/site";

export const instant = false;

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

function formatDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value.length > 10 ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  due: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-300",
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  void: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchMyInvoice(id);
  if (!result.ok) {
    if (result.status === 404) notFound();
    redirect("/login");
  }

  const invoice = result.data;
  const from = invoice.issued_by;
  const to = invoice.billed_to;
  const bank = from.bank;
  const hasBank = Boolean(bank.account_number && bank.name);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/account/billing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to billing
        </Link>
        <InvoicePrintButton />
      </div>

      {/* The document. Deliberately plain: this is the thing a bookkeeper
          prints, so it reads the same on paper as on screen. */}
      <article className="invoice-sheet mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="text-xl font-bold tracking-tight">{from.company_name}</p>
            {from.location ? (
              <p className="mt-1 text-sm text-muted-foreground">{from.location}</p>
            ) : null}
            {from.website ? (
              <p className="text-sm text-muted-foreground">
                {from.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </p>
            ) : null}
            {from.email ? (
              <p className="text-sm text-muted-foreground">{from.email}</p>
            ) : null}
            {from.vat_number ? (
              <p className="mt-1 text-sm text-muted-foreground">
                VAT {from.vat_number}
              </p>
            ) : null}
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Invoice
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{invoice.number}</p>
            <span
              className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                STATUS_STYLES[invoice.status] ?? STATUS_STYLES.draft
              }`}
            >
              {invoice.status_label}
            </span>
          </div>
        </header>

        <div className="grid gap-8 border-b border-border py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Billed to
            </p>
            <p className="mt-2 font-medium">{to.company_name}</p>
            {to.contact_name && to.contact_name !== to.company_name ? (
              <p className="text-sm text-muted-foreground">{to.contact_name}</p>
            ) : null}
            {to.address ? (
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {to.address}
              </p>
            ) : null}
            {to.email ? (
              <p className="mt-1 break-words text-sm text-muted-foreground">{to.email}</p>
            ) : null}
            {to.phone ? <p className="text-sm text-muted-foreground">{to.phone}</p> : null}
            {to.vat_number ? (
              <p className="mt-1 text-sm text-muted-foreground">VAT {to.vat_number}</p>
            ) : null}
          </div>

          <dl className="space-y-2.5 text-sm sm:text-right">
            <div className="flex justify-between gap-6 sm:block">
              <dt className="text-muted-foreground">Invoice date</dt>
              <dd className="font-medium">{formatDate(invoice.issued_on)}</dd>
            </div>
            <div className="flex justify-between gap-6 sm:block">
              <dt className="text-muted-foreground">Due</dt>
              <dd className="font-medium">{formatDate(invoice.due_on)}</dd>
            </div>
            {invoice.period_label ? (
              <div className="flex justify-between gap-6 sm:block">
                <dt className="text-muted-foreground">Covers</dt>
                <dd className="font-medium">{invoice.period_label}</dd>
              </div>
            ) : null}
            {invoice.paid_at ? (
              <div className="flex justify-between gap-6 sm:block">
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="font-medium">{formatDate(invoice.paid_at.slice(0, 10))}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <table className="w-full py-8 text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-3 font-semibold">Description</th>
              <th className="py-3 pl-4 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoice.lines.length > 0 ? (
              invoice.lines.map((line, index) => (
                <tr key={`${line.description}-${index}`}>
                  <td className="py-3.5">{line.description}</td>
                  <td className="py-3.5 pl-4 text-right">
                    {formatMoney(line.amount, invoice.currency)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-3.5">{invoice.description || "Monthly hosting"}</td>
                <td className="py-3.5 pl-4 text-right">
                  {formatMoney(invoice.amount, invoice.currency)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-foreground/20">
              <th className="py-4 text-right text-base font-semibold">Total due</th>
              <th className="py-4 pl-4 text-right text-xl font-semibold">
                {formatMoney(invoice.amount, invoice.currency)}
              </th>
            </tr>
          </tfoot>
        </table>

        <footer className="border-t border-border pt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            How to pay
          </p>
          <div className="mt-3 grid gap-6 sm:grid-cols-2">
            <div className="text-sm leading-relaxed text-muted-foreground">
              <p>
                Pay online from your billing page with a card, SnapScan, QR or instant
                EFT. The invoice is marked paid automatically once the payment clears.
              </p>
              {from.vat_number ? null : (
                <p className="mt-3 text-xs">
                  Not a VAT vendor. No VAT is charged on this invoice.
                </p>
              )}
            </div>

            {hasBank ? (
              <dl className="space-y-1 text-sm">
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted-foreground">Bank</dt>
                  <dd className="font-medium">{bank.name}</dd>
                </div>
                {bank.account_name ? (
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted-foreground">Account name</dt>
                    <dd className="font-medium">{bank.account_name}</dd>
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted-foreground">Account</dt>
                  <dd className="font-medium">{bank.account_number}</dd>
                </div>
                {bank.branch_code ? (
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted-foreground">Branch code</dt>
                    <dd className="font-medium">{bank.branch_code}</dd>
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted-foreground">Reference</dt>
                  <dd className="font-medium">{invoice.number}</dd>
                </div>
              </dl>
            ) : null}
          </div>
        </footer>
      </article>
    </>
  );
}
