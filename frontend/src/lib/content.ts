/**
 * Editable marketing copy and the icons that go with it.
 * Change wording here without touching the components.
 */
import {
  Activity,
  Briefcase,
  ChartColumn,
  CodeXml,
  DatabaseBackup,
  Gauge,
  Globe,
  GraduationCap,
  Headset,
  HeartPulse,
  LifeBuoy,
  MessageSquare,
  MonitorSmartphone,
  Palette,
  PenTool,
  Receipt,
  Rocket,
  Server,
  ShieldCheck,
  Store,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { DEFAULT_PLAN_SLUG, formatMoney, site } from "@/lib/site";
import type { AddOn, Plan } from "@/lib/types";

export { DEFAULT_PLAN_SLUG };

type IconItem = { icon: LucideIcon; title: string; text: string };

/** Used when the Django API is unreachable. Keep in sync with `seed_plans`. */
export const FALLBACK_PLANS: Plan[] = [
  {
    name: "Website Build & Hosting",
    slug: DEFAULT_PLAN_SLUG,
    tagline: "A professionally built website, hosted and maintained for you.",
    description:
      "We design and build your website, then host, secure and keep it updated for one flat monthly fee.",
    setup_fee: site.pricing.setupFee,
    monthly_fee: site.pricing.monthlyFee,
    currency: site.pricing.currency,
    features: [
      "Custom design and build",
      "Managed hosting and SSL certificate",
      "Mobile-friendly and fast by default",
      "Security updates and backups",
      "Content updates and ongoing support",
      "Domain setup assistance",
    ],
    is_featured: true,
  },
];

/** Used when the API is unreachable. Keep in sync with `seed_plans`. */
export const FALLBACK_ADDONS: AddOn[] = [
  {
    name: "Business email address",
    slug: "business-email",
    description:
      "An email address on your own domain, such as hello@yourbusiness.co.za, set up and managed for you.",
    monthly_fee: site.pricing.emailAddonFee,
    currency: site.pricing.currency,
  },
];

/** Short trust points shown directly under the hero. */
export const TRUST_POINTS: IconItem[] = [
  { icon: ShieldCheck, title: "SSL on every site", text: "Encrypted and secure by default" },
  { icon: DatabaseBackup, title: "Automated backups", text: "Your content is always protected" },
  { icon: Activity, title: "Uptime monitoring", text: "We watch your site so you don't have to" },
  { icon: Headset, title: "Real support", text: "Talk to the team that built your site" },
];

export type Service = {
  id: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  details: string[];
  included: boolean;
};

export const SERVICES: Service[] = [
  {
    id: "design",
    icon: MonitorSmartphone,
    title: "Website design & build",
    summary:
      "A modern, mobile-friendly website designed around your business and the customers you want to reach.",
    details: [
      "Design tailored to your brand, not a generic template",
      "Built for phones, tablets and desktops",
      "Fast load times and search-engine friendly structure",
      "Contact forms, maps, galleries and the pages you need",
    ],
    included: true,
  },
  {
    id: "hosting",
    icon: Server,
    title: "Managed hosting",
    summary:
      "Fast, secure hosting with SSL, backups and monitoring. We look after the servers so you never have to.",
    details: [
      "SSL certificate included",
      "Automated backups",
      "Uptime monitoring",
      "Performance tuning and caching",
    ],
    included: true,
  },
  {
    id: "support",
    icon: LifeBuoy,
    title: "Updates & support",
    summary:
      "Ongoing maintenance and support so your site stays current, secure and working the way it should.",
    details: [
      "Security patches and software updates",
      "Content changes when your business changes",
      "A real person to email when you need help",
      "Advice on growing your online presence",
    ],
    included: true,
  },
  {
    id: "dashboards",
    icon: ChartColumn,
    title: "Dashboards & reporting",
    summary:
      "Live dashboards that pull your business numbers onto one screen, so you can see how things are going without digging through spreadsheets.",
    details: [
      "Sales, traffic and performance in one view",
      "Pulls from the tools and spreadsheets you already use",
      "Updates on its own, so nobody rebuilds a report every week",
      "Private logins for you and your team",
    ],
    included: false,
  },
  {
    id: "custom-software",
    icon: CodeXml,
    title: "Custom software",
    summary:
      "Need more than a website? We build custom web applications, integrations and automations too.",
    details: [
      "Customer portals and internal tools",
      "Integrations with the systems you already use",
      "Automations that save hours of manual work",
      "Scoped and quoted separately",
    ],
    included: false,
  },
];

/** Everything that comes with the standard plan. */
export const CAPABILITIES: IconItem[] = [
  { icon: Palette, title: "Custom design", text: "A design built around your brand, not a generic template." },
  { icon: MonitorSmartphone, title: "Mobile-ready", text: "Looks and works great on phones, tablets and desktops." },
  { icon: Server, title: "Managed hosting", text: "Fast, reliable hosting that we run and maintain for you." },
  { icon: ShieldCheck, title: "SSL & security", text: "SSL certificate and security updates included." },
  { icon: DatabaseBackup, title: "Automated backups", text: "Regular backups so your content is never lost." },
  { icon: Gauge, title: "Speed & SEO-ready", text: "Fast load times and a search-friendly structure." },
  { icon: Globe, title: "Domain setup", text: "We help you connect a domain you own, or register a new one." },
  { icon: LifeBuoy, title: "Updates & support", text: "Content changes and help from a real team." },
];

export type JourneyStep = IconItem & {
  /** Who does the work at this step. Visitors need to see it is mostly us. */
  actor: "you" | "us";
  effort: string;
};

/** The four stages from first contact to a site that keeps running. */
export const JOURNEY: JourneyStep[] = [
  {
    icon: MessageSquare,
    title: "Tell us what you need",
    text: "Fill in a short form or give us a call. We talk through what your business does and what the website should achieve.",
    actor: "you",
    effort: "About 10 minutes",
  },
  {
    icon: PenTool,
    title: "We design and build it",
    text: "Our team designs your site and sends you a private preview link. You tell us what to change, and we change it.",
    actor: "us",
    effort: "We do the work",
  },
  {
    icon: Rocket,
    title: "We put it live",
    text: "We connect your domain, switch on the SSL certificate and launch the site on our hosting. Nothing for you to set up.",
    actor: "us",
    effort: "We handle launch",
  },
  {
    icon: ShieldCheck,
    title: "We look after it",
    text: "Hosting, security updates, backups and content changes are covered every month. You get on with running your business.",
    actor: "us",
    effort: "Every month, ongoing",
  },
];

/** Three-line answer to "what do you actually do?". */
export const PLAIN_ANSWER = [
  {
    icon: Palette,
    label: "We build it",
    text: "A professional website designed around your business.",
  },
  {
    icon: Server,
    label: "We host it",
    text: "It lives on our servers, secure and fast, with nothing for you to manage.",
  },
  {
    icon: LifeBuoy,
    label: "We look after it",
    text: "Updates, backups and a real person to email when you need a change.",
  },
];

export const STEPS: IconItem[] = [
  {
    icon: MessageSquare,
    title: "Tell us about your business",
    text: "Fill in the get-started form or get in touch. We talk through what you need and what the site should do.",
  },
  {
    icon: PenTool,
    title: "We design and build",
    text: "Our team designs and builds your website and sends you a preview link to review and comment on.",
  },
  {
    icon: Rocket,
    title: "We launch and host",
    text: "Once you're happy, we put it live on our managed hosting with your domain and SSL in place.",
  },
  {
    icon: ShieldCheck,
    title: "We keep it running",
    text: "Hosting, security, backups and support are covered by your monthly fee. You focus on your business.",
  },
];

export const STATS = [
  { value: formatMoney(site.pricing.setupFee), label: "Once-off setup fee" },
  { value: formatMoney(site.pricing.monthlyFee), label: "Per month for hosting" },
  { value: "1 team", label: "For design, hosting and support" },
  { value: "0", label: "Surprise invoices" },
];

export const INDUSTRIES: IconItem[] = [
  { icon: Store, title: "Retail & e-commerce", text: "Showcase products and turn visitors into customers." },
  { icon: Briefcase, title: "Professional services", text: "Build trust and make it easy for clients to reach you." },
  { icon: UtensilsCrossed, title: "Hospitality & restaurants", text: "Menus, bookings and directions in one place." },
  { icon: HeartPulse, title: "Health & wellness", text: "Clear information and easy appointment requests." },
  { icon: Wrench, title: "Trades & home services", text: "Show your work and get more quote requests." },
  { icon: GraduationCap, title: "Education & training", text: "Courses, schedules and enrolment information." },
];

export const WHY_US: IconItem[] = [
  {
    icon: CodeXml,
    title: "Engineered, not templated",
    text: "Your website is built by a software team, so it works properly, loads fast and can grow into something bigger later.",
  },
  {
    icon: Server,
    title: "Hosting is part of the deal",
    text: "No separate hosting bill and no server headaches. Hosting, SSL and backups are all included in the monthly fee.",
  },
  {
    icon: Receipt,
    title: "One predictable price",
    text: "A once-off setup fee and a flat monthly fee. You always know exactly what you are paying for.",
  },
];

export const FAQS = [
  {
    q: "What does the setup fee cover?",
    a: "The once-off setup fee covers the design and build of your website and getting it live on our hosting.",
  },
  {
    q: "What does the monthly fee include?",
    a: "Managed hosting, your SSL certificate, backups, security updates and support. It keeps your site online, fast and secure.",
  },
  {
    q: "Do I need the business email address?",
    a: "No, it is optional. It gives you an address on your own domain, such as hello@yourbusiness.co.za, instead of a personal Gmail. It adds R50 a month on top of hosting.",
  },
  {
    q: "How long does a website take?",
    a: "It depends on the size of the site and how quickly we receive your content. We agree on a timeline with you before we start.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. We help you connect a domain you already own, or guide you through registering a new one. The domain itself is billed by the registrar, not by us.",
  },
  {
    q: "How do I pay?",
    a: "We invoice you when you sign up. Online card payments through our payment gateway are coming soon.",
  },
];
