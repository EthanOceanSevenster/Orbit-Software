import { BarChart3, CircleCheck, Megaphone, PaintRoller, Search, ShoppingCart } from "lucide-react";
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

/** The work clients most often come back for, in plain terms. */
const OFFERS = [
  {
    icon: BarChart3,
    title: "A live dashboard",
    body: "Your sales, bookings, stock or jobs on one screen, updating itself. No spreadsheets to keep.",
  },
  {
    icon: Megaphone,
    title: "Marketing",
    body: "Getting people to your site: search, social and ads, run by us and reported on plainly.",
  },
  {
    icon: PaintRoller,
    title: "A redesign",
    body: "Same business, a look that matches where you are now rather than where you started.",
  },
  {
    icon: ShoppingCart,
    title: "An online shop",
    body: "Sell from your own site, take card payments, and see the orders in one place.",
  },
  {
    icon: Search,
    title: "SEO and search",
    body: "Being found when somebody searches for what you do, without paying for every click.",
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
        lead="What your plan already covers, and what else we can take off your hands."
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
              <li key={offer.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
                  <offer.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium">{offer.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {offer.body}
                  </p>
                </div>
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
