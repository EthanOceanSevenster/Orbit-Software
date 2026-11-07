import type { ReactNode } from "react";

import { Container } from "@/components/Container";
import { OrbitBackground } from "@/components/OrbitBackground";

/** Navy page banner used at the top of inner pages. */
export function PageHeader({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-hero relative overflow-hidden text-white">
      <OrbitBackground />
      <Container className="relative py-16 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-sky-300">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {text ? <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{text}</p> : null}
        {children}
      </Container>
    </section>
  );
}
