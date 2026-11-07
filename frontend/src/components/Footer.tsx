import { ArrowUp, Mail, MapPin } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/Container";
import { CopyrightYear } from "@/components/CopyrightYear";
import { Logo } from "@/components/Logo";
import { SERVICES } from "@/lib/content";
import { formatMoney, publicEmail, site } from "@/lib/site";

const COMPANY_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/#why-orbit", label: "Why Orbit" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/contact", label: "Contact" },
  { href: "/get-started", label: "Get started" },
];

export function Footer() {
  return (
    <footer className="bg-navy text-slate-300">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo inverse />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">{site.description}</p>
            <p className="mt-6 inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
              {formatMoney(site.pricing.setupFee)} setup · {formatMoney(site.pricing.monthlyFee)} / month hosting
            </p>
          </div>

          <FooterColumn title="Services" className="lg:col-span-3">
            {SERVICES.map((service) => (
              <li key={service.id}>
                <Link href={`/services#${service.id}`} className="hover:text-white">
                  {service.title}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Company" className="lg:col-span-2">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Get in touch" className="lg:col-span-3">
            <li>
              {publicEmail ? (
                <a href={`mailto:${publicEmail}`} className="flex items-center gap-2.5 hover:text-white">
                  <Mail className="h-4 w-4 text-sky-400" aria-hidden="true" />
                  {publicEmail}
                </a>
              ) : (
                <Link href="/contact" className="flex items-center gap-2.5 hover:text-white">
                  <Mail className="h-4 w-4 text-sky-400" aria-hidden="true" />
                  Send us a message
                </Link>
              )}
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-sky-400" aria-hidden="true" />
              {site.location}
            </li>
          </FooterColumn>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; <CopyrightYear /> {site.legalName}. All rights reserved. Prices in South African Rand (ZAR).
          </p>
          <a href="#" className="inline-flex items-center gap-1.5 hover:text-white">
            Back to top <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm">{children}</ul>
    </div>
  );
}
