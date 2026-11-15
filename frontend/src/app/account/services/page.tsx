import {
  BarChart3,
  CircleCheck,
  Megaphone,
  PaintRoller,
  Search,
  ShoppingCart,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Empty, PageHeading, Panel } from "@/components/console/parts";
import { ServiceRequestPanel } from "@/components/portal/ServiceRequestPanel";
import { fetchMyAccount, fetchMyServiceRequests } from "@/lib/portal";

export const instant = false;

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

/**
 * What else we can do, in the client's own terms.
 *
 * Each one carries a worked example, because "a live dashboard" means nothing
 * to somebody who runs a plumbing business. "You stop rebuilding that stock
 * spreadsheet every Friday" means something immediately.
 */
const OFFERS = [
  {
    icon: BarChart3,
    title: "A live dashboard",
    body: "Your numbers on one screen, updating themselves. Power BI, or a private page on your own website.",
    example:
      "A restaurant sees last week's takings, which dishes sold and what stock is running low, without anyone opening a spreadsheet.",
  },
  {
    icon: Workflow,
    title: "Automation",
    body: "The job you do by hand every week, done for you while you are asleep.",
    example:
      "A plumber's quote requests land straight in a spreadsheet, the customer gets an instant confirmation, and a reminder goes out if nobody replies in three days.",
  },
  {
    icon: Megaphone,
    title: "Marketing",
    body: "Getting people to your site: search, social and ads, run for you and reported in plain language.",
    example:
      "An attorney goes from twelve visitors a month to two hundred, and three of them book a consultation.",
  },
  {
    icon: PaintRoller,
    title: "A redesign",
    body: "Same business, a look that matches where you are now rather than where you started.",
    example:
      "A guest house that has doubled in size replaces photographs from 2019 and a layout nobody can read on a phone.",
  },
  {
    icon: ShoppingCart,
    title: "An online shop",
    body: "Sell from your own site, take card payments, and see every order in one place.",
    example:
      "A bakery takes cake orders and deposits online instead of a hundred WhatsApp messages a week.",
  },
  {
    icon: Search,
    title: "SEO and search",
    body: "Being found when somebody searches for what you do, without paying for every click.",
    example:
      "An electrician appears on the first page for \"electrician\" plus their town, rather than on page four.",
  },
];

export default async function ServicesPage() {
  const [accountResult, requestResult] = await Promise.all([
    fetchMyAccount(),
    fetchMyServiceRequests(),
  ]);
  if (!accountResult.ok) redirect("/login");

  const account = accountResult.data;
  const requests = requestResult.ok ? requestResult.data : [];
  const covered = account.services ?? [];

  return (
    <>
      <PageHeading
        title="Services"
        lead="What you already pay for, and what else I can take off your hands. Every one has an example, so you can see what it would actually look like for you."
      />

      <Panel title="What your plan covers">
        {covered.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {covered.map((service) => (
              <li key={service} className="flex items-start gap-3 text-sm">
                <CircleCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink"
                  aria-hidden="true"
                />
                <span>{service}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>
            No plan on your profile yet. Tell us what you need below and we will put one
            together.
          </Empty>
        )}
      </Panel>

      <div className="mt-6">
        <Panel title="What else we can do">
          <ul className="grid gap-5 sm:grid-cols-2">
            {OFFERS.map((offer) => (
              <li
                key={offer.title}
                className="rounded-xl border border-border bg-background p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
                    <offer.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="font-semibold">{offer.title}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {offer.body}
                </p>
                {/* The example does the explaining. The description alone
                    leaves a non-technical client guessing. */}
                <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed">
                  <span className="font-medium text-brand-ink">For example: </span>
                  <span className="text-muted-foreground">{offer.example}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            Nothing is charged until you have a quote and agree to it.
          </p>
        </Panel>
      </div>

      <div id="request" className="mt-6 scroll-mt-28">
        <ServiceRequestPanel
          requests={requests}
          openByDefault={requests.length === 0}
        />
      </div>
    </>
  );
}
