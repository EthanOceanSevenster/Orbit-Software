import { ArrowRight, Compass } from "lucide-react";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <section className="py-28">
      <Container className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-brand-ink">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Page not found</h1>
        <p className="mt-4 text-muted-foreground">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/">
            Back to home <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact us
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
