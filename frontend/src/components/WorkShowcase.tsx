import { ArrowRight, ArrowUpRight, CircleCheck, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CLIENT_SITES } from "@/lib/clients";

/**
 * Sites we have actually built, linking to the live thing.
 *
 * A prospect does not want to read that we are good; they want to click
 * through to a real business and see for themselves. Every card links out to
 * the live site, which is also the only honest way to show work: if it is not
 * up, it does not go here.
 */
export function WorkShowcase() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {CLIENT_SITES.map((client) => (
        <article
          key={client.url}
          className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-xl hover:shadow-black/5"
        >
          <Link href={`/work/${client.slug}`} className="block">
            <div className="relative overflow-hidden border-b border-border bg-muted">
              <Image
                src={client.shot}
                alt={`Home page of the ${client.name} website`}
                width={1440}
                height={900}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </Link>

          <div className="p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{client.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{client.sector}</p>
              </div>
              <a
                href={client.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:border-brand hover:text-brand-ink"
              >
                Visit
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {client.summary}
            </p>

            <ul className="mt-5 space-y-2">
              {client.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <CircleCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href={`/work/${client.slug}`}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline"
            >
              How we built it
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {client.location}
              </span>
              <a
                href={client.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-ink hover:underline"
              >
                {client.display}
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
