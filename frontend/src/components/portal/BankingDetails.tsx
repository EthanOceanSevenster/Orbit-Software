import { Building2, Copy, Landmark } from "lucide-react";

import type { ClientAccount } from "@/lib/types";

type Bank = NonNullable<ClientAccount["pay_to"]>;

/**
 * How to pay by EFT.
 *
 * Card is one button away, but at R120 a month plenty of clients would
 * rather push an EFT from their banking app, and a client who cannot find
 * where to pay simply does not pay. The reference matters as much as the
 * number: an unreferenced deposit is an afternoon of matching it to an
 * invoice by hand.
 *
 * The details come from the same BANK_* settings that print on the invoice,
 * so there is one place to change them.
 *
 * Renders nothing until the account name and number are both set. A
 * half-complete set of banking details is worse than none, because somebody
 * will try to use it.
 */
export function BankingDetails({
  bank,
  reference,
  companyName,
}: {
  bank: Bank;
  /** Usually the invoice number. */
  reference?: string;
  companyName: string;
}) {
  if (!bank?.account_name || !bank?.account_number) return null;

  const rows = [
    { label: "Account name", value: bank.account_name },
    { label: "Bank", value: bank.name },
    { label: "Account number", value: bank.account_number },
    { label: "Branch code", value: bank.branch_code },
    { label: "Reference", value: reference || "Your invoice number" },
  ].filter((row) => Boolean(row.value));

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
          <Landmark className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">Pay by EFT</h2>
          <p className="text-sm text-muted-foreground">
            Or use Pay now for a card.
          </p>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 flex items-start gap-2.5 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
        <Copy className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
        <span>
          Please use the reference above exactly. It is how {companyName} matches your
          payment to your invoice, and without it an EFT can sit unallocated for days.
        </span>
      </p>

      <p className="mt-3 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        An EFT usually reflects the same day between South African banks, or the next
        working day if it is sent after hours.
      </p>
    </section>
  );
}
