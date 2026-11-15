import { Quote } from "lucide-react";

import { Container } from "@/components/Container";
import { SectionHeading } from "@/components/SectionHeading";
import { TESTIMONIALS, clientBySlug } from "@/lib/clients";

/**
 * What clients have said, in their own words.
 *
 * Renders nothing at all until somebody has actually said something. A
 * "what our clients say" heading over two invented quotes is the oldest tell
 * of a business with no clients, and anybody can phone the client and check.
 */
export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="border-t border-border bg-muted py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="In their words"
          title="What clients say"
          text="Unedited, and from businesses you can phone."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((item) => {
            const client = item.client ? clientBySlug(item.client) : undefined;
            return (
              <figure
                key={item.quote}
                className="rounded-2xl border border-border bg-card p-8"
              >
              <Quote className="h-7 w-7 text-brand-ink/40" aria-hidden="true" />
              <blockquote className="mt-4 text-[1.05rem] leading-relaxed">
                {item.quote}
              </blockquote>
              <figcaption className="mt-6 border-t border-border pt-4 text-sm">
                <span className="font-semibold">{item.name}</span>
                <span className="block text-muted-foreground">
                  {item.role}
                  {client ? (
                    <>
                      {" · "}
                      <a href={`/work/${client.slug}`} className="hover:text-brand-ink hover:underline">
                        See the site we built
                      </a>
                    </>
                  ) : null}
                </span>
              </figcaption>
              </figure>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
