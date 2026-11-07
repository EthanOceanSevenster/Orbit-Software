import { Container } from "@/components/Container";
import { IconRow } from "@/components/IconTile";
import { TRUST_POINTS } from "@/lib/content";

export function TrustBar() {
  return (
    <section className="border-b border-border bg-card">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_POINTS.map((point) => (
          <IconRow key={point.title} {...point} />
        ))}
      </Container>
    </section>
  );
}
