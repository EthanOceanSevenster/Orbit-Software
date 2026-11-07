"use client";

import { CircleCheck, CreditCard, FileText } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/Button";
import { FormAlert } from "@/components/forms/shared";
import { startPayment } from "@/lib/portal-client";
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

    // Paystack hosts the payment page, so hand the browser straight over.
    window.location.assign(result.url);
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold">No invoices yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your first invoice will appear here once it is raised.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-7 sm:p-8">
        <h2 className="text-lg font-semibold">Invoices</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay online, or use the bank details on the invoice we email you.
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
                <span className="font-semibold">{invoice.number}</span>
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
                  disabled={busyId === invoice.id}
                  size="sm"
                >
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  {busyId === invoice.id ? "Starting..." : "Pay now"}
                </Button>
              ) : invoice.status === "paid" ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CircleCheck className="h-4 w-4" aria-hidden="true" />
                  Paid
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
