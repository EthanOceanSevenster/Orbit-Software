import { ArrowLeft, CircleCheck, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { IconBadge } from "@/components/IconTile";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Create your profile",
  description: `Create a ${site.name} profile to request a website, a dashboard or marketing, and to follow the work from one place.`,
  robots: { index: false, follow: false },
};

const POINTS = [
  "Ask for a website, a dashboard, marketing or anything else",
  "Follow where each request stands, from quote to done",
  "See what you pay and when, and settle it from the same page",
];

export default function RegisterPage() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to the website
          </Link>

          <div className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
            <IconBadge icon={UserPlus} size="lg" />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              Create your profile
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              It takes a minute. Once you are in you can tell us what you need and we
              will come back to you with a quote.
            </p>

            <ul className="mt-6 space-y-2.5 border-y border-border py-6">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm">
                  <CircleCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <RegisterForm />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have a profile?{" "}
            <Link href="/login" className="font-semibold text-brand-ink hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
