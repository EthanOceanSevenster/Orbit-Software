import { AlertTriangle, Clock, MessageSquare, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeading, Panel } from "@/components/console/parts";
import { fetchMyAccount } from "@/lib/portal";

export const instant = false;

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

/** What someone actually wants to know: how fast, and what counts as urgent. */
const TIMES = [
  {
    icon: AlertTriangle,
    tone: "text-amber-500",
    title: "Site down or broken",
    body: "Start the message with the word urgent. We begin as soon as we see it.",
  },
  {
    icon: Wrench,
    tone: "text-brand-ink",
    title: "Text, photos, prices, a new page",
    body: "Same or next working day, and included in what you already pay.",
  },
  {
    icon: Clock,
    tone: "text-muted-foreground",
    title: "Anything bigger",
    body: "We send a price first. Nothing is started or charged until you agree.",
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

      <Panel title="Ask us something">
        <Link
          href="/account/services#request"
          className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-base font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover"
        >
          <MessageSquare className="h-4.5 w-4.5" aria-hidden="true" />
          Send us a message
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          It arrives with your account attached, so we already know who you are and what
          you are on.
        </p>
      </Panel>

      <div className="mt-6">
        <Panel title="How quickly">
          <ul className="space-y-5">
            {TIMES.map((item) => (
              <li key={item.title} className="flex gap-3">
                <item.icon
                  className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${item.tone}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        To change the email you sign in with, or your business name, just ask.
      </p>
    </>
  );
}
