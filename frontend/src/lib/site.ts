/**
 * Single place to change company details. Everything on the site reads from here.
 *
 * Deliberately company-only: no personal name and no phone number anywhere on
 * the site. Enquiries arrive by email or through the contact form, which posts
 * to the API and notifies a private inbox that is never shown to visitors.
 */
export const site = {
  name: "Orbit Software",
  // Not "(Pty) Ltd": that claims a CIPC registration the business does not
  // have, and the footer is the one place a customer looks for it. Change it
  // back the day the company is registered.
  legalName: "Orbit Software",
  // One developer, said plainly and without a name. "A developer" is not an
  // identity, so this stays anonymous while being true. The alternative was
  // claiming a team, which the first reply from a one-person business
  // immediately contradicts.
  tagline: "Websites built and hosted by one developer, not a template shop",
  description:
    "Professional websites for South African small businesses, designed, built and hosted by one developer. One once-off fee to get started, one flat monthly fee after that.",
  location: "South Africa",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  pricing: {
    currency: "ZAR",
    /**
     * Once-off, and worth showing broken down.
     *
     * R500 on its own invites "what is the catch". R200 for your own domain
     * plus R300 for the build answers that before it is asked, and the domain
     * half is money we pass on rather than keep.
     */
    setupFee: 500,
    /** The domain, registered in the client's name. Part of the setup fee. */
    domainFee: 200,
    /** Designing and building the site. The rest of the setup fee. */
    buildFee: 300,
    /** Monthly hosting, support, SSL and backups. */
    monthlyFee: 120,
    /** Optional business email address on your own domain, per month. */
    emailAddonFee: 50,
    /** Once-off, to create the mailbox and point the domain's mail records. */
    emailSetupFee: 50,
    /** Hosting plus the business email add-on. */
    monthlyWithEmail: 170,
    /** Email marketing: writing and sending campaigns, per month. */
    marketingFee: 80,
    /** Once-off, to build the list, verify a sending domain and design the template. */
    marketingSetupFee: 400,
  },
  nav: [
    { href: "/services", label: "Services" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/work", label: "Our work" },
    { href: "/pricing", label: "Pricing" },
    { href: "/#why-orbit", label: "Why Orbit" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

/**
 * Public contact email.
 *
 * Empty on purpose: there is no company mailbox yet, and showing an address
 * that bounces is worse than showing none. While it is empty the site routes
 * every enquiry through the contact form, which reaches the private inbox
 * without exposing any address.
 *
 * When a real company mailbox exists, put it here. It must be a company
 * address, never a personal one, or the business becomes traceable to a person.
 *
 * Typed as `string` rather than inferred, so the empty value does not narrow to
 * a literal and break the `publicEmail ? ... : ...` checks in the components.
 */
export const publicEmail: string = "";

/** Slug of the default plan. Must match the plan created by `manage.py seed_plans`. */
export const DEFAULT_PLAN_SLUG = "website-build-and-hosting";

const CURRENCY_SYMBOLS: Record<string, string> = {
  ZAR: "R",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/** Formats 120 as "R120" (or "R120.50" when there are cents). */
export function formatMoney(amount: number | string, currency: string = site.pricing.currency): string {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(value)) return "";
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const hasCents = Math.round(value * 100) % 100 !== 0;
  return (
    symbol +
    value.toLocaleString("en-US", {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}
