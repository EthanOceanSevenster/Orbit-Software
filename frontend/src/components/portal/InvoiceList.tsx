"use client";

import { CircleCheck, CreditCard, FileText, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/Button";
import { FormAlert } from "@/components/forms/shared";
import { loadPaystackInline, startPayment } from "@/lib/portal-client";
import { formatMoney } from "@/lib/site";
import type { Invoice } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  due: "bg-brand-soft text-brand-ink",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-300",
  draft: "bg-muted text-muted-foreground",
  void: "bg-muted text-muted-foreground",
};

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Where the customer finishes paying.
 *
 * Paystack's panel opens over this page rather than sending them to another
 * site, so they pay somewhere they recognise. Whatever the panel reports, the
 * browser is then sent to our own return route, which asks Paystack what
 * actually happened. A page cannot mark its own invoice paid.
 */
export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePay(invoice: Invoice) {
    setBusyId(invoice.id);
    setMessage(null);

    const result = await startPayment(invoice.id);
    if (!result.ok) {
      setBusyId(null);
      setMessage(result.message);
      return;
    }

    const ready = result.accessCode ? await loadPaystackInline() : false;
    if (!ready || !window.PaystackPop) {
      // The script is blocked or slow. The hosted page is the same
      // transaction, so hand the browser over rather than stall.
      window.location.assign(result.url);
      return;
    }

    const settleUrl = `/api/billing/paystack/return/?reference=${encodeURIComponent(
      result.reference,
    )}`;

    // settleUrl is a server route that answers with a redirect, not a page in
    // this app, so the Next router cannot follow it. A full navigation is the
    // point: the server verifies with Paystack and decides where we land.
    /* eslint-disable @next/next/no-location-assign-relative-destination */
    new window.PaystackPop().resumeTransaction(result.accessCode, {
      onSuccess: () => window.location.assign(settleUrl),
      // Also go through the return route on a cancel: the customer may have
      // paid and closed the panel before it caught up.
      onCancel: () => window.location.assign(settleUrl),
      onError: () => {
        setBusyId(null);
        setMessage("That payment could not be completed. Please try again.");
      },
    });
    /* eslint-enable @next/next/no-location-assign-relative-destination */
  }

  const payable = invoices.filter((i) => i.is_payable);
  const outstanding = payable.reduce((sum, i) => sum + Number(i.amount), 0);
  const currency = invoices[0]?.currency ?? "ZAR";

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold">No invoices yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your first invoice will appear here once it is raised.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* The one thing they came to do, given room to be obvious */}
      {payable.length > 0 ? (
        <div className="bg-hero relative overflow-hidden rounded-2xl p-7 text-white sm:p-9">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sky-300">
                Due now
              </p>
              <p className="mt-2 text-5xl font-semibold tracking-tight sm:text-6xl">
                {formatMoney(outstanding.toFixed(2), currency)}
              </p>
              <p className="mt-3 text-slate-300">
                {payable.length === 1
                  ? `Invoice ${payable[0].number}, due ${formatDate(payable[0].due_on)}`
                  : `Across ${payable.length} invoices`}
              </p>
            </div>

            <div className="shrink-0">
              <Button
                onClick={() => handlePay(payable[0])}
                disabled={busyId !== null}
                size="lg"
                variant="inverse"
                className="w-full px-8 text-base sm:w-auto"
              >
                {busyId !== null ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Opening...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" aria-hidden="true" />
                    Pay {formatMoney(payable[0].amount, payable[0].currency)}
                  </>
                )}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Card, SnapScan, EFT or QR
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-7 sm:p-8">
          <h2 className="text-lg font-semibold">Your invoice history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every invoice we have raised. Open one to see what it covers, print it,
            or save it as a PDF.
          </p>
          {message ? (
            <div className="mt-5">
              <FormAlert kind="error">{message}</FormAlert>
            </div>
          ) : null}
        </div>

        <ul className="divide-y divide-border">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/account/billing/${invoice.id}`}
                    className="font-semibold text-brand-ink hover:underline"
                  >
                    {invoice.number}
                  </Link>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      STATUS_STYLES[invoice.status] ?? STATUS_STYLES.draft
                    }`}
                  >
                    {invoice.status_label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {invoice.description || "Monthly hosting"} &middot;{" "}
                  {invoice.status === "paid"
                    ? `Paid ${invoice.paid_at ? formatDate(invoice.paid_at.slice(0, 10)) : ""}`
                    : `Due ${formatDate(invoice.due_on)}`}
                </p>
              </div>

              <div className="flex items-center gap-5 sm:shrink-0">
                <span className="text-lg font-semibold">
                  {formatMoney(invoice.amount, invoice.currency)}
                </span>
                {invoice.is_payable ? (
                  <Button
                    onClick={() => handlePay(invoice)}
                    disabled={busyId !== null}
                    size="sm"
                    variant="secondary"
                  >
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    {busyId === invoice.id ? "Opening..." : "Pay this one"}
                  </Button>
                ) : invoice.status === "paid" ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CircleCheck className="h-4 w-4" aria-hidden="true" />
                    Paid
                  </span>
                ) : null}
                <Link
                  href={`/account/billing/${invoice.id}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
