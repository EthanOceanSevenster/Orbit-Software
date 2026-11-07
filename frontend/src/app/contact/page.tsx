import { ArrowRight, Mail, MapPin, Rocket } from "lucide-react";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/Button";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/forms/ContactForm";
import { IconBadge } from "@/components/IconTile";
import { PageHeader } from "@/components/PageHeader";
import { publicEmail, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name} about a new website, hosting or custom software.`,
};

const CHANNELS: { icon: typeof Mail; title: string; value: string; href: string | null }[] = [
  ...(publicEmail
    ? [
        {
          icon: Mail,
          title: "Email us",
          value: publicEmail,
          href: `mailto:${publicEmail}`,
        },
      ]
    : [
        {
          icon: Mail,
          title: "Email us",
          value: "Use the form, it reaches us directly",
          href: null,
        },
      ]),
  { icon: MapPin, title: "Where we are", value: site.location, href: null },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to our team"
        text="Questions about pricing, hosting or a project you have in mind? Send us a message and the right person will get back to you."
      />

      <section className="bg-muted py-16 sm:py-20">
        <Container className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            {CHANNELS.map((channel) => (
              <div key={channel.title} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
                <IconBadge icon={channel.icon} />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{channel.title}</p>
                  {channel.href ? (
                    <a href={channel.href} className="block truncate font-semibold hover:text-brand-ink">
                      {channel.value}
                    </a>
                  ) : (
                    <p className="font-semibold">{channel.value}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-brand/30 bg-brand-soft p-6">
              <Rocket className="h-6 w-6 text-brand-ink" aria-hidden="true" />
              <h2 className="mt-4 font-semibold">Ready to start a website?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Skip the back-and-forth and send us your project details directly.
              </p>
              <ButtonLink href="/get-started" size="sm" className="mt-5">
                Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10 lg:col-span-8">
            <h2 className="text-xl font-semibold">Send us a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">We reply by email, usually within one working day.</p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
