import { formatMoney, site } from "@/lib/site";

/**
 * The legal pages, as content rather than markup.
 *
 * Kept here so the three pages share one voice and one set of facts, and so
 * a price or a notice period is changed in exactly one place. Every figure
 * reads from `site.pricing`, so these pages can never quietly disagree with
 * the pricing page.
 *
 * Written plainly on purpose. A policy nobody can read protects nobody: if
 * a client only discovers the notice period in a dispute, the wording did
 * its job for a lawyer and failed at its actual job.
 */
export type LegalSection = { heading: string; body: string[] };

/** Last reviewed. Shown on each page, because a policy with no date is not one. */
export const LEGAL_UPDATED = "16 November 2026";

export const TERMS: LegalSection[] = [
  {
    heading: "Who you are dealing with",
    body: [
      `${site.legalName} is a sole proprietorship based in ${site.location}, run by one developer who designs, builds and hosts websites for small businesses. Enquiries and notices reach us through the contact form on this site, and we reply by email.`,
      "These terms apply to every website, dashboard and piece of software we build, and to the monthly hosting and support that follows. Accepting a quote or paying an invoice means accepting them.",
    ],
  },
  {
    heading: "What we do and what it costs",
    body: [
      `A website is ${formatMoney(site.pricing.setupFee)} once-off to design, build and launch, then ${formatMoney(site.pricing.monthlyFee)} a month for hosting, the SSL certificate, backups, security updates and content changes.`,
      `The once-off fee is two parts: ${formatMoney(site.pricing.domainFee)} registers your domain in your name, and ${formatMoney(site.pricing.buildFee)} covers designing and building the site.`,
      "Add-ons and other services are quoted before any work starts. Nothing is charged that you have not agreed to in writing first.",
      "All prices are in South African Rand. We are not a VAT vendor, so no VAT is charged and none can be claimed back.",
    ],
  },
  {
    heading: "What you own",
    body: [
      "Your domain is registered in your name and belongs to you, during and after. So do your content, your images and your data.",
      "Once the work is paid for, the website we build for you is yours. If you leave, we hand over your content and your domain and help you move. We do not hold a site hostage.",
      "The tools and the underlying code we reuse across clients remain ours.",
    ],
  },
  {
    heading: "What we need from you",
    body: [
      "The text, images and details that belong on your site, and answers to questions within a reasonable time. A build stalls when it waits on content, and we cannot promise a launch date we do not control.",
      "You confirm that anything you send us is yours to use, and that it is lawful. We will not publish content that breaks South African law.",
    ],
  },
  {
    heading: "Paying",
    body: [
      "The once-off fee is invoiced when the work is agreed. The monthly fee is invoiced on the first of each month and covers the month ahead.",
      "An invoice is payable within seven days. A card saved for automatic payment is charged when the invoice is raised; you can remove it at any time from your billing page.",
      "If an invoice is more than thirty days overdue we may suspend the site, after telling you first. Nothing is deleted while an account is merely suspended.",
    ],
  },
  {
    heading: "Ending it",
    body: [
      "Either of us can end the monthly service with thirty days written notice. There is no fixed term and no penalty.",
      "On the last day we hand over your content and your domain. Hosting then stops, and we keep a backup for thirty days in case you need something from it.",
    ],
  },
  {
    heading: "What we promise and what we cannot",
    body: [
      "We will build what was agreed, host it properly, keep it updated and fix what breaks. Hosting is on managed infrastructure with backups and monitoring.",
      "We cannot promise a position in Google, a number of visitors or a number of sales. Anybody who does is guessing. We build sites that search engines can read and that load quickly, which is the part that is actually in our hands.",
      "We cannot promise a site is never offline. Hosting providers and networks fail. We are responsible for getting it back, not for the internet.",
      "Our liability for anything that goes wrong is limited to what you have paid us in the three months before it happened. Nothing here limits liability for anything the law does not allow us to limit.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "If these terms change, the new version appears here with a new date, and anyone on a monthly service is told by email before it applies to them.",
      "These terms are governed by South African law.",
    ],
  },
];

export const PRIVACY: LegalSection[] = [
  {
    heading: "The short version",
    body: [
      "We collect the few things needed to quote for work, build your site, invoice you and answer you. We do not sell anything to anybody, we do not run advertising trackers, and we do not share your details except with the services named below that make the business work.",
      `This notice is written to meet the Protection of Personal Information Act. ${site.legalName} is the responsible party for the information described here.`,
    ],
  },
  {
    heading: "What we collect",
    body: [
      "From an enquiry: your name, your email address, your business name if you give it, and whatever you type in the message. That is all the contact form and the chat assistant ask for.",
      "From a client: the same, plus a billing address, a phone number if you give one, your VAT number if you have one, your domain and your invoice history.",
      "From a payment: the amount, the date, the reference and a token standing for your card. We never see or store a card number. The card itself stays with the payment provider.",
      "From the website: the ordinary server logs that record a request was made. We do not run analytics or advertising cookies. The only cookie we set is the one that keeps you signed in, and the one that remembers whether you chose light or dark.",
    ],
  },
  {
    heading: "Why we have it and what we do with it",
    body: [
      "To reply to you, to build and host what you asked for, to invoice you, and to tell you about something that affects your own site. Nothing else.",
      "We do not send marketing to clients who have not asked for it, and anything we do send has an unsubscribe link that works.",
    ],
  },
  {
    heading: "Who else sees it",
    body: [
      "The hosting provider that runs the servers, the payment provider that processes a card payment, the domain registrar that holds your domain, and the email service that delivers our messages. Each sees only what it needs to do its job.",
      "Nobody else. We do not sell, rent or trade personal information, and we have no advertising partners.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "An enquiry that goes nowhere is kept for a year, in case you come back.",
      "Client records are kept while you are a client and for five years afterwards, because South African tax law requires invoices to be kept that long.",
      "A backup of your site is kept for thirty days after you leave, then deleted.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You can ask what we hold about you, ask for it to be corrected, ask for it to be deleted where the law does not require us to keep it, and object to how we use it. Ask through the contact form and we will answer within a reasonable time and at no charge.",
      "If you are not satisfied you can complain to the Information Regulator of South Africa.",
    ],
  },
  {
    heading: "Keeping it safe",
    body: [
      "Everything travels over an encrypted connection. Passwords are hashed and cannot be read back, by us or by anybody else. Access to client records is limited to the one person who runs the business.",
      "If a breach ever affects your information, you will be told, along with what happened and what to do about it.",
    ],
  },
];

export const REFUNDS: LegalSection[] = [
  {
    heading: "Before the work starts",
    body: [
      "Changed your mind before we have started designing? Tell us and the setup fee is refunded in full, less the domain fee if the domain has already been registered in your name. A registered domain cannot be unregistered, and it stays yours either way.",
    ],
  },
  {
    heading: "While the site is being built",
    body: [
      "If you cancel part way through, we refund the part of the build fee that covers work not yet done, judged honestly and explained to you in writing.",
      "If you are unhappy with the design, we would rather fix it than refund it. Changes during the build are included and unlimited, and most of what people call a refund is a design they were too polite to argue about.",
    ],
  },
  {
    heading: "The monthly fee",
    body: [
      "The monthly fee covers the month ahead and is not refunded part way through a month. Cancel with thirty days notice and you simply stop being invoiced; the site stays up for the period you have paid for.",
      "If we fail to deliver the service for a sustained period and it is our fault, we credit the affected month. You do not have to ask twice.",
    ],
  },
  {
    heading: "Once-off work",
    body: [
      "Data analysis, dashboards, automations and other quoted work are refundable before we start and not once delivered, because the thing you bought has been handed over and cannot be returned.",
    ],
  },
  {
    heading: "How a refund is paid",
    body: [
      "Back to where it came from: a card refund to the same card, an EFT to the account it came from. Refunds are processed within five working days of being agreed.",
      "Ask through the contact form, say what you are asking for and why, and you will get a straight answer rather than a form.",
    ],
  },
];
