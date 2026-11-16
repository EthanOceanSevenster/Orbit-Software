import {
  ArrowRight,
  CircleCheck,
} from "lucide-react";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { HeroScene } from "@/components/HeroScene";
import { OrbitBackground } from "@/components/OrbitBackground";

const HIGHLIGHTS = ["Hosting & SSL included", "One flat monthly fee", "Real people for support"];

export function Hero() {
  return (
    <section className="bg-hero relative overflow-hidden text-white">
      <OrbitBackground />
      <Container className="relative grid items-center gap-16 py-24 sm:py-32 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-6 xl:col-span-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-sky-200">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Website design · Managed hosting · Support
          </p>
          <h1 className="mt-7 text-[2.75rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-[4rem]">
            Website design and hosting for{" "}
            <span className="bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
              South African
            </span>{" "}
            small businesses.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Designed, built and hosted by one developer, for one once-off fee and
            one monthly fee. No agency, no account manager, no template, and the
            person who builds your site is the person who answers when you need
            something changed.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/get-started" size="lg">
              Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/pricing" variant="outlineInverse" size="lg">
              View pricing
            </ButtonLink>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CircleCheck className="h-5 w-5 shrink-0 text-sky-400" strokeWidth={1.75} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-6 xl:col-span-7">
          <HeroScene />
        </div>
      </Container>
    </section>
  );
}
