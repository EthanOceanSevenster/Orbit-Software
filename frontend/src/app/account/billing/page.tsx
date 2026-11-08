import { CalendarClock, CircleCheck, Receipt } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeading, Panel, StatCard, formatDate } from "@/components/console/parts";
import { InvoiceList } from "@/components/portal/InvoiceList";
import { fetchMyAccount, fetchMyInvoices } from "@/lib/portal";
import { formatMoney } from "@/lib/site";

export const instant = false;

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default async function BillingPage() {
  const [accountResult, invoiceResult] = await Promise.all([
    fetchMyAccount(),
    fetchMyInvoices(),
  ]);
  if (!accountResult.ok) redirect("/login");

  const account = accountResult.data;
  const invoices = invoiceResult.ok ? invoiceResult.data : [];
  const currency = account.currency ?? "ZAR";
  const toPay = invoices.filter((i) => i.is_payable);
  const paid = invoices.filter((i) => i.status === "paid");
  const outstanding = toPay.reduce((sum, i) => sum + Number(i.amount), 0);
  const isPending = account.status === "pending";

  return (
    <>
      <PageHeading
        title="Billing"
        lead="What you pay, when it is due, and everything we have invoiced you for."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          icon={CalendarClock}
          label="Every month"
          value={isPending ? "Nothing yet" : formatMoney(account.monthly_total ?? "0", currency)}
          note={
            isPending
              ? "No plan on your profile yet"
              : `${account.plan_name || "Your plan"}, billed monthly`
          }
        />
        <StatCard
          icon={Receipt}
          label="Outstanding"
          value={formatMoney(outstanding.toFixed(2), currency)}
          note={`${toPay.length} invoice${toPay.length === 1 ? "" : "s"} to pay`}
          alert={toPay.length > 0}
        />
        <StatCard
          icon={CircleCheck}
          label="Next payment"
          value={formatDate(account.next_payment_date, "Not set")}
          note={
            account.next_payment_date
              ? "We will email you beforehand"
              : "We will agree a date with you"
          }
        />
      </div>

      <div className="mt-6">
        <InvoiceList invoices={invoices} />
      </div>

      <div className="mt-6">
        <Panel title="How paying works">
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Pay now</strong> opens a secure payment
              page. We never see or store your card details.
            </li>
            <li>
              <strong className="text-foreground">By transfer</strong> is fine too. The
              bank details are on the invoice we email you.
            </li>
            <li>
              <strong className="text-foreground">Marked paid</strong> only happens once
              the payment is confirmed, so this page is never ahead of reality.
            </li>
          </ul>
          {paid.length > 0 ? (
            <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
              {paid.length} invoice{paid.length === 1 ? " has" : "s have"} been settled.
              Thank you.
            </p>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
