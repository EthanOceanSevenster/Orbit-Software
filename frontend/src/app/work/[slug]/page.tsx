import { ArrowRight, ArrowUpRight, CircleCheck, Layers, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { OrbitBackground } from "@/components/OrbitBackground";
import { SectionHeading } from "@/components/SectionHeading";
import { CLIENT_SITES, clientBySlug } from "@/lib/clients";

/*
 * The slug is read in the page body, so this segment cannot be part of the
 * instant shell. Same reason as every page under /account: Cache Components
 * will not hand URL data to a shell that is served before the request is
 * known. generateStaticParams still builds both pages ahead of time.
 */
export const instant = false;

export function generateStaticParams() {
  return CLIENT_SITES.map((client) => ({ slug: client.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const client = clientBySlug((await params).slug);
  if (!client) return {};
  return {
    title: `${client.name} — our work`,
    description: `${client.sector} in ${client.location}. ${client.summary}`,
  };
}

/**
 * One page per client.
 *
 * It says what the business is, what the site had to do and what we built.
 * It does not claim a result, because we have not measured one: a case study
 * with an invented "leads up 60%" is checkable in one phone call, and the
 * client is the person who would be phoned.
 */
export default async function ClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const client = clientBySlug((await params).slug);
  if (!client) notFound();

  const others = CLIENT_SITES.filter((item) => item.slug !== client.slug);

  return (
    <>
      <section className="bg-hero relative overflow-hidden text-white">
        <OrbitBackground />
        <Container className="relative py-16 sm:py-20">
          <nav className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/work" className="hover:text-white">
              Our work
            </Link>
            <span>/</span>
            <span className="text-slate-200">{client.name}</span>
          </nav>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.12em] text-sky-300">
            {client.sector}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {client.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            {client.summary}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-300" aria-hidden="true" />
              {client.location}
            </span>
            <a
              href={client.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-sky-300"
            >
              {client.display}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </Container>
      </section>

      {/* The site itself */}
      <section className="py-16 sm:py-20">
        <Container>
          <a href={client.url} target="_blank" rel="noreferrer" className="group block">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
              <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="ml-3 truncate text-xs text-muted-foreground">
                  {client.display}
                </span>
              </div>
              <Image
                src={client.shot}
                alt={`The ${client.name} home page`}
                width={1440}
                height={900}
                sizes="(min-width: 1024px) 70vw, 100vw"
                priority
                className="w-full transition-transform duration-500 group-hover:scale-[1.01]"
              />
            </div>
          </a>
        </Container>
      </section>

      {/* Brief and build */}
      <section className="border-t border-border bg-muted py-20 sm:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeading align="left" eyebrow="The brief" title="What the site had to do" />
              <div className="mt-6 space-y-4">
                {client.brief.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="h-4 w-4 text-brand-ink" aria-hidden="true" />
                  Pages on the site
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {client.pages.map((page) => (
                    <li
                      key={page}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      {page}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-7">
              <SectionHeading align="left" eyebrow="The build" title="What we built" />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {client.built.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
                    <CircleCheck
                      className="h-5 w-5 text-brand-ink"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <h3 className="mt-4 font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                The site is hosted, kept updated and backed up by us on the same monthly
                plan every client is on. Changes go live the same week they are asked for.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* The other clients */}
      {others.length > 0 ? (
        <section className="py-20 sm:py-28">
          <Container>
            <SectionHeading eyebrow="Also" title="More of our work" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {others.map((item) => (
                <Link
                  key={item.slug}
                  href={`/work/${item.slug}`}
                  className="group flex items-center gap-5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand"
                >
                  <Image
                    src={item.shot}
                    alt=""
                    width={320}
                    height={200}
                    className="h-20 w-32 shrink-0 rounded-lg border border-border object-cover object-top"
                  />
                  <span>
                    <span className="block font-semibold">{item.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {item.sector}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
                      Read more
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <CtaBand />
    </>
  );
}
