import { AlertTriangle, Clock, LifeBuoy, MessageSquare, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeading, Panel } from "@/components/console/parts";
import { fetchMyAccount } from "@/lib/portal";
import { publicEmail, site } from "@/lib/site";

export const instant = false;

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

const ANSWERS = [
  {
    q: "Something on my site is wrong or broken",
    a: "Send it through and we fix it. If the site is down or something is broken, say so and it goes to the front of the queue.",
  },
  {
    q: "I want to change text, photos or prices",
    a: "Content updates are part of what you already pay. Tell us what to change and what to change it to, and we do the rest.",
  },
  {
    q: "I want a new page",
    a: "Usually straightforward and usually included. If it turns into a bigger piece of work we will tell you before doing anything.",
  },
  {
    q: "I need my business email set up on my phone",
    a: "Ask and we will send you the settings, or walk you through it.",
  },
  {
    q: "I have a question about an invoice",
    a: "Ask us directly. Nothing is ever charged without an invoice you can see on your billing page first.",
  },
];

export default async function SupportPage() {
  const result = await fetchMyAccount();
  if (!result.ok) redirect("/login");

  return (
    <>
      <PageHeading
        title="Support"
        lead="However small the question, ask it. That is what the monthly fee is for."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Ask us something">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The quickest route is the request form on your services page. It arrives with
            your account attached, so we already know who you are and what you are on.
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link
              href="/account/services#request"
              className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm hover:bg-brand-hover"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Send us a message
            </Link>
            {publicEmail ? (
              <a
                href={`mailto:${publicEmail}`}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-muted"
              >
                Email us
              </a>
            ) : (
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-muted"
              >
                Use the contact form
              </Link>
            )}
          </div>
        </Panel>

        <Panel title="When to expect an answer">
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <span>
                <strong>Site down or broken.</strong> We start as soon as we see it. Say
                &ldquo;urgent&rdquo; in your message so it is not read as an ordinary change.
              </span>
            </li>
            <li className="flex gap-3">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
              <span>
                <strong>Content changes.</strong> Usually the same or next working day.
              </span>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>
                <strong>New work to quote.</strong> We come back with a price before
                anything is started or charged.
              </span>
            </li>
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Common questions">
          <dl className="divide-y divide-border">
            {ANSWERS.map((item) => (
              <div key={item.q} className="py-4 first:pt-0 last:pb-0">
                <dt className="font-medium">{item.q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Your details">
          <div className="flex gap-3">
            <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              To change the email address you sign in with, or your business name, ask us
              and we will update it. We do not change your details without you asking.
              {site.name} is based in {site.location}.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
