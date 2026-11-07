import {
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CircleCheck,
  ExternalLink,
  Globe,
  Megaphone,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { IconBadge } from "@/components/IconTile";
import { InvoiceList } from "@/components/portal/InvoiceList";
import { LogoutButton } from "@/components/portal/LogoutButton";
import { fetchMyAccount, fetchMyInvoices } from "@/lib/portal";
import { formatMoney } from "@/lib/site";

function formatDate(value?: string | null): string {
  if (!value) return "Not scheduled";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function AccountOverview() {
  const result = await fetchMyAccount();
  if (!result.ok) {
    // Not signed in, or the session expired. Either way, the login page is the
    // right place to land.
    redirect("/login");
  }

  const account = result.data;

  if (!account.has_account) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">You are signed in</h1>
          <p className="mt-3 text-muted-foreground">
            This login is not linked to a client account yet. Get in touch and we will
            connect it.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink href="/contact">Contact us</ButtonLink>
            <LogoutButton />
          </div>
        </div>
      </Container>
    );
  }

  const invoicesResult = await fetchMyInvoices();
  const invoices = invoicesResult.ok ? invoicesResult.data : [];
  const currency = account.currency ?? "ZAR";
  const monthly = account.monthly_total ?? "0";
  const isActive = account.status === "active";

  return (
    <>
      {/* Header */}
      <section className="bg-hero relative overflow-hidden text-white">
        <Container className="relative py-12 sm:py-16">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sky-300">
                Your account
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {account.company_name}
              </h1>
              <span
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {account.status_label}
              </span>
            </div>
            <LogoutButton />
          </div>
        </Container>
      </section>

      <section className="bg-muted py-12 sm:py-16">
        <Container className="space-y-6">
          {/* The three things they asked to see */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-7">
              <IconBadge icon={CalendarClock} />
              <p className="mt-6 text-sm text-muted-foreground">Next payment</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight">
                {formatMoney(monthly, currency)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Due {formatDate(account.next_payment_date)}
              </p>
              <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
                {account.plan_name
                  ? `${account.plan_name}, billed monthly`
                  : "Billed monthly"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-7">
              <IconBadge icon={Globe} />
              <p className="mt-6 text-sm text-muted-foreground">Your website</p>
              {account.website_url ? (
                <>
                  <a
                    href={account.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 break-all text-lg font-semibold text-brand-ink hover:underline"
                  >
                    {account.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Hosted, secured and backed up by us.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Your site is not live yet. We will add the link here the moment it is.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-7">
              <IconBadge icon={Receipt} />
              <p className="mt-6 text-sm text-muted-foreground">Billing</p>
              <p className="mt-1 text-lg font-semibold">
                {invoices.filter((i) => i.is_payable).length > 0
                  ? `${invoices.filter((i) => i.is_payable).length} to pay`
                  : "Nothing outstanding"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {invoices.length} invoice{invoices.length === 1 ? "" : "s"} in total
              </p>
              <Link
                href="#billing"
                className="mt-4 inline-flex items-center gap-1.5 border-t border-border pt-4 text-sm font-semibold text-brand-ink hover:underline"
              >
                See invoices <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Services */}
          <div className="rounded-2xl border border-border bg-card p-7 sm:p-8">
            <h2 className="text-lg font-semibold">What your plan covers</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(account.services ?? []).map((service) => (
                <li key={service} className="flex items-start gap-3 text-sm">
                  <CircleCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink"
                    aria-hidden="true"
                  />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Billing */}
          <div id="billing" className="scroll-mt-28">
            <InvoiceList invoices={invoices} />
          </div>

          {/* Upsell */}
          <div className="bg-hero relative overflow-hidden rounded-2xl p-8 text-white sm:p-10">
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sky-300">
                    <BarChart3 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sky-300">
                    <Megaphone className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                  Want a dashboard or marketing?
                </h2>
                <p className="mt-3 leading-relaxed text-slate-300">
                  We build live dashboards that pull your business numbers onto one
                  screen, and we can run the marketing that brings people to your site.
                  Tell us what you are after and we will put together a quote.
                </p>
              </div>
              <ButtonLink href="/contact" variant="inverse" size="lg" className="shrink-0">
                Talk to us <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
