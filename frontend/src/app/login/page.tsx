import { ArrowLeft, LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { LoginForm } from "@/components/forms/LoginForm";
import { IconBadge } from "@/components/IconTile";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Client sign in",
  description: `Sign in to your ${site.name} account to see your next payment, your website and the services you are on.`,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
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
            <IconBadge icon={LayoutDashboard} size="lg" />
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Client sign in</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              See your next payment, your live website and everything your plan covers.
            </p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Not a client yet?{" "}
            <Link href="/get-started" className="font-semibold text-brand-ink hover:underline">
              Get started
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Lost your password?{" "}
            <Link href="/contact" className="font-semibold text-brand-ink hover:underline">
              Ask us to reset it
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
