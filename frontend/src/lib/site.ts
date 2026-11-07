/**
 * Single place to change company details. Everything on the site reads from here.
 *
 * Deliberately company-only: no personal name and no phone number anywhere on
 * the site. Enquiries arrive by email or through the contact form, which posts
 * to the API and notifies a private inbox that is never shown to visitors.
 */
export const site = {
  name: "Orbit Software",
  legalName: "Orbit Software (Pty) Ltd",
  tagline: "Websites built and hosted by a software team",
  description:
    "We design, build and host professional websites for businesses. One once-off setup fee, a low flat monthly fee, and a software team behind your site.",
  location: "South Africa",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  pricing: {
    currency: "ZAR",
    /** Once-off, covers design and build. */
    setupFee: 500,
    /** Monthly hosting, support, SSL and backups. */
    monthlyFee: 120,
    /** Optional business email address on your own domain. */
    emailAddonFee: 50,
    /** Hosting plus the business email add-on. */
    monthlyWithEmail: 170,
  },
  nav: [
    { href: "/services", label: "Services" },
    { href: "/#how-it-works", label: "How it works" },
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
