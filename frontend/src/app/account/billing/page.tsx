import { CalendarClock, CircleCheck, Clock, Receipt } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeading, Panel, StatCard, formatDate } from "@/components/console/parts";
import { BankingDetails } from "@/components/portal/BankingDetails";
import { SavedCard } from "@/components/portal/SavedCard";
import { InvoiceList } from "@/components/portal/InvoiceList";
import { fetchMyAccount, fetchMyInvoices, fetchSavedCard } from "@/lib/portal";
import { formatMoney } from "@/lib/site";

export const instant = false;

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  // Set by the return view after a payment, so the first thing they see is
  // whether it went through rather than a page that looks unchanged.
  const { payment } = await searchParams;

  const [accountResult, invoiceResult, cardResult] = await Promise.all([
    fetchMyAccount(),
    fetchMyInvoices(),
    fetchSavedCard(),
  ]);
  if (!accountResult.ok) redirect("/login");

  const account = accountResult.data;
  const invoices = invoiceResult.ok ? invoiceResult.data : [];
  const currency = account.currency ?? "ZAR";
  const toPay = invoices.filter((i) => i.is_payable);
  // The panel hides itself when the account is not configured yet.
  const bank = account.pay_to;
  const card = cardResult.ok ? cardResult.data : null;
  const nextReference = toPay[0]?.number;
  const paid = invoices.filter((i) => i.status === "paid");
  const outstanding = toPay.reduce((sum, i) => sum + Number(i.amount), 0);
  const isPending = account.status === "pending";

  return (
    <>
      <PageHeading
        title="Billing"
        lead="What you pay, when it is due, and everything we have invoiced you for."
      />

      {payment === "paid" ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-800 dark:text-emerald-200">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <strong>Payment received.</strong> Thank you. Your invoice below is
            marked paid, and we have a record of it.
          </div>
        </div>
      ) : null}

      {payment === "pending" ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3.5 text-sm text-amber-800 dark:text-amber-200">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <strong>We are still confirming that payment.</strong> If your bank
            has taken the money it will show here shortly. Please do not pay
            again. If it has not cleared within an hour, tell us and we will
            look into it.
          </div>
        </div>
      ) : null}

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

      {card ? (
        <div className="mt-6">
          <SavedCard card={card} companyName={bank?.company_name ?? "we"} />
        </div>
      ) : null}

      {bank ? (
        <div className="mt-6">
          <BankingDetails
            bank={bank}
            reference={nextReference}
            companyName={bank.company_name}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <Panel title="How paying works">
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Pay now</strong> opens a secure payment
              page. We never see or store your card details.
            </li>
            <li>
              <strong className="text-foreground">By transfer</strong> is fine too. The
              bank details are below and on every invoice, and the reference is the
              invoice number.
            </li>
            <li>
              <strong className="text-foreground">Marked paid</strong> only happens once
              the payment is confirmed, so this page is never ahead of reality.
            </li>
            <li>
              <strong className="text-foreground">Paid in advance.</strong> Each invoice
              covers the month ahead, and says on it which month that is. Your site
              stays up for a period you have already paid for.
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
