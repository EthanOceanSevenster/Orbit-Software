import { CircleCheck, ExternalLink, Globe, Lock, Rocket, Save } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Empty, PageHeading, Panel } from "@/components/console/parts";
import { fetchMyAccount } from "@/lib/portal";

export const instant = false;

export const metadata: Metadata = {
  title: "My website",
  robots: { index: false, follow: false },
};

/** What we look after on a client's behalf, whether or not they ever ask. */
const LOOKED_AFTER = [
  {
    icon: Rocket,
    title: "Hosting",
    body: "Your site runs on our server and is online around the clock. If it goes down we hear about it, not you.",
  },
  {
    icon: Lock,
    title: "Certificate",
    body: "The padlock in the address bar. It renews itself, so it can never quietly expire.",
  },
  {
    icon: Save,
    title: "Backups",
    body: "Taken regularly and kept off the server, so a bad day is an inconvenience rather than a disaster.",
  },
  {
    icon: CircleCheck,
    title: "Updates",
    body: "Security patches are applied as they are released. You do not need to ask.",
  },
];

export default async function WebsitePage() {
  const result = await fetchMyAccount();
  if (!result.ok) redirect("/login");
  const account = result.data;

  const url = account.website_url;
  const shown = url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";

  return (
    <>
      <PageHeading
        title="My website"
        lead="Where your site lives and what we look after on it."
      />

      <Panel title="Your address">
        {url ? (
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
              <Globe className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 break-all text-lg font-semibold text-brand-ink hover:underline"
              >
                {shown}
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
              <p className="mt-1 text-sm text-muted-foreground">
                Live and served over a secure connection.
              </p>
            </div>
          </div>
        ) : (
          <Empty>
            Your site is not live yet. The address will appear here the moment it is,
            and we will email you as well.
          </Empty>
        )}
      </Panel>

      <div className="mt-6">
        <Panel title="What we look after">
          <ul className="grid gap-5 sm:grid-cols-2">
            {LOOKED_AFTER.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-ink">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Changes to your pages">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Text, photographs, prices, opening hours, a new page: send it through and we
            make the change. Content updates are part of what you already pay, so there
            is nothing extra to approve for ordinary edits.
          </p>
          <Link
            href="/account/services"
            className="mt-4 inline-block text-sm font-semibold text-brand-ink hover:underline"
          >
            Ask for a change
          </Link>
        </Panel>
      </div>
    </>
  );
}
