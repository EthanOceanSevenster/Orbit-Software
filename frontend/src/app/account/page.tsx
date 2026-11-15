import { CalendarClock, Globe, Receipt, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeading, Panel, StatCard, formatDate } from "@/components/console/parts";
import { fetchMyAccount, fetchMyInvoices, fetchMyServiceRequests } from "@/lib/portal";
import { formatMoney, site } from "@/lib/site";

export const instant = false;

export const metadata: Metadata = {
  title: "Your account",
  description: `Your ${site.name} account.`,
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const result = await fetchMyAccount();
  if (!result.ok) redirect("/login");
  const account = result.data;

  if (!account.has_account) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">You are signed in</h1>
        <p className="mt-3 text-muted-foreground">
          This login is not linked to a client account yet. Get in touch and we will
          connect it.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block font-semibold text-brand-ink hover:underline"
        >
          Contact us
        </Link>
      </div>
    );
  }

  const [invoiceResult, requestResult] = await Promise.all([
    fetchMyInvoices(),
    fetchMyServiceRequests(),
  ]);
  const invoices = invoiceResult.ok ? invoiceResult.data : [];
  const requests = requestResult.ok ? requestResult.data : [];
  const toPay = invoices.filter((i) => i.is_payable);
  const currency = account.currency ?? "ZAR";
  const isPending = account.status === "pending";

  return (
    <>
      <PageHeading
        title={account.company_name ?? "Your account"}
        lead={
          isPending
            ? "Your profile is ready. Tell us what you need and we will come back with a quote."
            : "What you pay, where your site lives, and everything your plan covers."
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarClock}
          label="Next payment"
          value={isPending ? "Nothing yet" : formatMoney(account.monthly_total ?? "0", currency)}
          note={
            isPending
              ? "You pay once we have agreed on the work"
              : `Due ${formatDate(account.next_payment_date, "when we agree a date")}`
          }
          href="/account/billing"
        />
        <StatCard
          icon={Receipt}
          label="To pay"
          value={String(toPay.length)}
          note={
            toPay.length > 0
              ? `${formatMoney(
                  toPay.reduce((sum, i) => sum + Number(i.amount), 0).toFixed(2),
                  currency,
                )} outstanding`
              : "Nothing outstanding"
          }
          alert={toPay.length > 0}
          href="/account/billing"
        />
        <StatCard
          icon={Globe}
          label="Your website"
          value={account.website_url ? "Live" : "Being built"}
          note={account.website_url ? "Hosted and backed up by us" : "We will add the link here"}
          href="/account/website"
        />
        <StatCard
          icon={Sparkles}
          label="Requests"
          value={String(requests.length)}
          note={requests.length > 0 ? "Sent to us" : "Ask us for anything"}
          href="/account/services"
        />
      </div>

      <div className="mt-6">
        <Panel title="Your details">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Business" value={account.company_name} />
            <Detail label="Contact" value={account.contact_name} />
            <Detail label="Email for invoices" value={account.billing_email} />
            <Detail label="Phone" value={account.phone} />
            <Detail label="VAT number" value={account.vat_number} />
            <Detail label="Client since" value={formatDate(account.client_since, "")} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Detail label="Address" value={account.address} multiline />
            </div>
          </dl>
          <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
            These appear on your invoices. Anything wrong or missing, tell us and we
            will correct it. We never change your details without you asking.
          </p>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Your plan">
          <p className="text-sm text-muted-foreground">
            {account.plan_name
              ? `${account.plan_name}, billed monthly.`
              : "No plan on this profile yet."}
          </p>
          <Link
            href="/account/services"
            className="mt-4 inline-block text-sm font-semibold text-brand-ink hover:underline"
          >
            See everything it covers
          </Link>
        </Panel>

        <Panel title="Need something else?">
          <p className="text-sm text-muted-foreground">
            A dashboard of your numbers, marketing to bring people to your site, a
            redesign, an online shop. Tell us and we will quote it.
          </p>
          <Link
            href="/account/services"
            className="mt-4 inline-block text-sm font-semibold text-brand-ink hover:underline"
          >
            Request a service
          </Link>
        </Panel>
      </div>
    </>
  );
}

/**
 * One detail, or an honest blank.
 *
 * A missing phone number shows as "Not given" rather than an empty space, so
 * a client can see what we are missing and tell us.
 */
function Detail({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  const text = (value ?? "").trim();
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm ${text ? "" : "text-muted-foreground"} ${
          multiline ? "whitespace-pre-line" : "break-words"
        }`}
      >
        {text || "Not given"}
      </dd>
    </div>
  );
}
