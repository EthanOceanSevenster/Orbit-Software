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
  Smartphone,
  Store,
  UtensilsCrossed,
  Workflow,
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
  {
    name: "Dashboard & Reporting",
    slug: "dashboard-and-reporting",
    tagline: "Your business numbers on one screen, kept up to date.",
    description:
      "We build a Power BI report from the data you already have, then host it and refresh it every month so the numbers are never stale.",
    setup_fee: site.pricing.dashboardSetupFee,
    monthly_fee: site.pricing.dashboardMonthlyFee,
    currency: site.pricing.currency,
    features: [
      "A report built around the questions you actually ask",
      "Hosted and refreshed every month",
      "Works from a spreadsheet, a till system or your website",
      "Opens on a phone as well as a laptop",
      "Changes to the report included",
    ],
    is_featured: false,
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
    setup_fee: site.pricing.emailSetupFee,
    currency: site.pricing.currency,
  },
  {
    name: "Email marketing",
    slug: "email-marketing",
    description:
      "We write and send marketing emails to your customer list, and tell you afterwards how many opened them.",
    monthly_fee: site.pricing.marketingFee,
    setup_fee: site.pricing.marketingSetupFee,
    currency: site.pricing.currency,
  },
  {
    name: "Priority support",
    slug: "priority-support",
    description:
      "Same-day answers on working days and first place in the queue for changes, instead of the usual two.",
    monthly_fee: site.pricing.prioritySupportFee,
    currency: site.pricing.currency,
  },
  {
    name: "Data analysis, once off",
    slug: "data-analysis",
    description:
      "A written answer to a question about your numbers: what sells, when, to whom, and what it costs you. Charged once, not monthly.",
    monthly_fee: 0,
    setup_fee: site.pricing.dataAnalysisFee,
    currency: site.pricing.currency,
  },
];

/** Short trust points shown directly under the hero. */
export const TRUST_POINTS: IconItem[] = [
  { icon: ShieldCheck, title: "SSL on every site", text: "Encrypted and secure by default" },
  { icon: DatabaseBackup, title: "Automated backups", text: "Your content is always protected" },
  { icon: Activity, title: "Uptime monitoring", text: "If it goes down I hear about it, not you" },
  { icon: Headset, title: "One person to ask", text: "Email the developer who built your site" },
];

export type Service = {
  /** Used for the anchor on /services and as the URL of its own page. */
  id: string;
  icon: LucideIcon;
  title: string;
  /** The heading its own page leads with, written for somebody searching. */
  heading: string;
  summary: string;
  details: string[];
  included: boolean;
  /** Two or three paragraphs, for the page of its own. */
  body: string[];
  /** What somebody is worrying about before they enquire. */
  questions: { q: string; a: string }[];
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
    heading: "Website design and build for small businesses",
    body: [
      "A website earns its keep by answering the three questions a customer has before they phone: what do you do, do you do it near me, and can I trust you. Everything else on a page is decoration.",
      "We design around those answers, then build the site by hand rather than assembling it from a template. That is why it loads quickly on a phone on a weak signal, which is how most South Africans will see it.",
      "You see a private preview link before anything goes live, and changes during the build are included and unlimited.",
    ],
    questions: [
      { q: "How long does it take?", a: "Usually a week to ten days from the point we have your content. The part that takes longest is almost always waiting for photographs and text." },
      { q: "Can I change it later?", a: "Yes, and content changes are covered by the monthly fee. You email what you want changed and it is done, usually the same week." },
      { q: "Do I need to write the words?", a: "You know your business and we write the page. You tell us what you do and who for, and we turn it into something a customer will read." },
    ],
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
    heading: "Managed website hosting in South Africa",
    body: [
      "Hosting is the part most small businesses get wrong, usually by buying the cheapest shared plan and discovering a year later that nobody has updated anything.",
      "Your site runs on managed infrastructure with an SSL certificate, automated backups and uptime monitoring. If something breaks, we hear about it rather than you, and fixing it is included.",
      "There is no separate hosting bill and no control panel to learn. It is part of the monthly fee.",
    ],
    questions: [
      { q: "Where is my site hosted?", a: "On managed cloud infrastructure, with backups kept separately. We handle the servers, the certificates and the updates." },
      { q: "What if it goes down?", a: "Monitoring tells us before a customer does, and getting it back is our job, not yours. No hosting is immune to an outage; what matters is who notices and how fast it is fixed." },
      { q: "Can I move it elsewhere later?", a: "Yes. Your domain is in your name and the site is yours once it is paid for. If you leave, we hand it over and help you move." },
    ],
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
    heading: "Website updates and support",
    body: [
      "A website is not finished when it launches. Prices change, a service is added, a photograph is out of date, and a plugin somewhere needs patching.",
      "The monthly fee covers the lot: security updates, content changes and a person who answers. Not a ticket queue and not a chatbot. The developer who built your site is the one who reads the email.",
      "Most changes are done the same week they are asked for.",
    ],
    questions: [
      { q: "How many changes do I get?", a: "Ordinary content changes are not counted. If a request turns into a new section or a new feature, we quote it before doing it." },
      { q: "How do I ask for a change?", a: "Email, or through your client portal. You do not have to describe it in technical language." },
      { q: "What counts as support?", a: "Anything about your site that is not working, anything you want changed, and advice about whether an idea is worth doing." },
    ],
  },
  {
    id: "dashboards",
    icon: ChartColumn,
    title: "Dashboards & reporting",
    summary:
      "Live dashboards that pull your business numbers onto one screen, so you can see how things are going without digging through spreadsheets.",
    details: [
      "Power BI, or a private dashboard on your own website",
      "Sales, bookings, stock and cash in one view",
      "Pulls from the tools and spreadsheets you already use",
      "Refreshes on its own, so nobody rebuilds a report every week",
    ],
    included: false,
    heading: "Power BI dashboards and reporting",
    body: [
      "Most small businesses already have the numbers. They are spread across a till system, a spreadsheet and a bank statement, and nobody has the afternoon it takes to put them together.",
      "We build a report that pulls them into one screen and refreshes on its own, so the answer to how last month went takes ten seconds instead of an evening.",
      "Built around the questions you actually ask, not every number that happens to exist.",
    ],
    questions: [
      { q: "What does it cost?", a: "R300 once-off to build the report, then R120 a month to host it and keep it refreshed." },
      { q: "Where does the data come from?", a: "Spreadsheets, a till or accounting system, your website, or a mix. If you can export it, it can usually be used." },
      { q: "Do I need Power BI myself?", a: "No. We host the report and you open it in a browser, on a phone as easily as a laptop." },
    ],
  },
  {
    id: "automation",
    icon: Workflow,
    title: "Automation",
    summary:
      "The jobs you do every week by hand, done for you. Quotes, invoices, reminders, reports and the copying between systems that eats a morning.",
    details: [
      "Invoices and payment reminders that send themselves",
      "Enquiries that land straight in your spreadsheet or inbox",
      "Reports built and emailed on a schedule",
      "Two systems kept in step without anyone retyping",
    ],
    included: false,
    heading: "Business automation for small teams",
    body: [
      "Every small business has a job somebody does by hand every week because that is how it has always been done: retyping an order, chasing an unpaid invoice, building the same report every Monday.",
      "Those are the jobs worth automating first, because they are repetitive, they are predictable, and the time they eat is the owner’s own.",
      "We find the one that costs you the most time, automate it, and leave it running where you can see it.",
    ],
    questions: [
      { q: "What can be automated?", a: "Invoices and reminders that send themselves, enquiries that land straight in a spreadsheet, reports emailed on a schedule, and two systems kept in step without anyone retyping." },
      { q: "What does it cost?", a: "Quoted per job, because they differ enormously. A reminder that sends itself is an afternoon; an integration between two systems is longer." },
      { q: "Will it break?", a: "Anything automated is monitored, and if it stops we hear about it. That is part of the ongoing fee." },
    ],
  },
  {
    id: "mobile-apps",
    icon: Smartphone,
    title: "Mobile app development",
    summary:
      "An app built to your specification. From R1,500 to build, then R500 a month to host and look after.",
    details: [
      "From R1,500 to build, R500 a month to host",
      "Android and iPhone from one build",
      "Written specification you sign off first",
      "Play Store publishing, API keys and paid services billed separately",
    ],
    included: false,
    heading: "Mobile app development, built to your specification",
    body: [
      "Not every business needs an app, and the first job is working out whether yours does. If your customers would open it once and forget it, a website that works properly on a phone is the cheaper and better answer \u2014 and we will tell you so.",
      "When an app is the right answer \u2014 bookings customers make themselves, a loyalty card that lives in their pocket, staff capturing work out on site \u2014 it is built to a written specification: what every screen does, what happens when there is no signal, and what it costs, all agreed before a line is written.",
      "One build covers both Android and iPhone, which is what keeps it affordable. We handle publishing to the Play Store and the App Store, and the app is looked after afterwards the same way a website is.",
    ],
    questions: [
      { q: "What does an app cost?", a: "From R1,500 to build and R500 a month to host it, keep it updated and keep it working. What it has to do decides the build fee, so we scope it with you first and put a fixed price in writing before anything begins." },
      { q: "What is not included?", a: "Putting it on the Google Play Store is charged on top, and Google\u2019s own developer fee is paid by you. Anything the app relies on from somebody else \u2014 API keys, maps, SMS, payment gateways \u2014 is billed to you directly rather than marked up by us." },
      { q: "Do I need an app or just a website?", a: "Most small businesses need the website first. An app earns its place when people come back often, when it has to work without signal, or when it needs the camera, notifications or a phone\u2019s location. We will say honestly which one you need." },
      { q: "How long does it take?", a: "Longer than a website. A small app is a few weeks; anything with accounts, payments or offline use is longer. The specification tells us, which is why we write it first." },
    ],
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
    heading: "Custom web applications and internal tools",
    body: [
      "Sometimes a website is not the thing. A customer portal, a booking system, an internal tool that replaces a shared spreadsheet, an integration between software that does not talk.",
      "This is the work the business was started to do, and it is quoted and built like any other software project: scoped first, in writing, with a price before anything begins.",
      "Built by a developer rather than assembled from plugins, which matters more here than anywhere else.",
    ],
    questions: [
      { q: "How is it priced?", a: "Quoted per project after we have talked about what it has to do. No project starts without a written scope and a price." },
      { q: "Can you work with my existing systems?", a: "Usually. If it has an API or can export a file, it can generally be connected." },
      { q: "Who owns the code?", a: "You own what is built for you. The general-purpose tooling we reuse across clients stays ours." },
    ],
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
  {
    icon: LifeBuoy,
    title: "Updates & support",
    text: "Content changes, done by the person who built your site.",
  },
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
    text: "Fill in a short form. Six questions, about two minutes. I read every one myself and reply by email.",
    actor: "you",
    effort: "About 10 minutes",
  },
  {
    icon: PenTool,
    title: "We design and build it",
    text: "I design and build your site, then send you a private preview link. You tell me what to change, and I change it.",
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
    text: "I design and build your website and send you a preview link to review and comment on.",
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
    text: "Your website is written by a developer, not assembled from a template, so it works properly, loads fast and can grow into something bigger later.",
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
    a: `It is two things. ${formatMoney(site.pricing.domainFee)} registers your domain, in your name, and ${formatMoney(site.pricing.buildFee)} covers designing and building your site and getting it live on our hosting.`,
  },
  {
    q: `Why is the setup only ${formatMoney(site.pricing.setupFee)}?`,
    a: `Because the monthly fee is where this works for us. Nearly half of it, ${formatMoney(site.pricing.domainFee)}, is your domain and we pass that on. A low build fee gets small businesses online without a large upfront cost, and we earn it back over the years you stay. We would rather have a client for five years than one big invoice.`,
  },
  {
    q: "Who owns the website and the domain?",
    a: "You do. The domain is registered in your name, not ours, and if you ever leave we hand over your site files. Nothing here holds you in place except the work being good.",
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
    q: "What happens to the domain after the first year?",
    a: `Your first year is inside the ${formatMoney(site.pricing.setupFee)} setup fee. After that we invoice the renewal once a year, currently ${formatMoney(site.pricing.domainFee)}, separately from your monthly fee. Your monthly price never changes because of it.`,
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
