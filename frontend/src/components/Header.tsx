"use client";

import { ArrowRight, ChevronDown, LogIn, Mail, Menu, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ButtonLink, buttonClasses } from "@/components/Button";
import { containerClass } from "@/components/Container";
import { Logo } from "@/components/Logo";
import { SERVICES } from "@/lib/content";
import { formatMoney, publicEmail, site } from "@/lib/site";

const LINKS = site.nav.filter((item) => item.href !== "/services");

function subscribeToScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}
const getScrolled = () => window.scrollY > 8;
const getServerScrolled = () => false;

export function Header() {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribeToScroll, getScrolled, getServerScrolled);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close the services menu on Escape or a click outside it.
  useEffect(() => {
    if (!servicesOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setServicesOpen(false);
    }
    function onPointerDown(event: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [servicesOpen]);

  function openServices() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setServicesOpen(true);
  }
  function scheduleCloseServices() {
    closeTimer.current = setTimeout(() => setServicesOpen(false), 150);
  }
  function closeAll() {
    setServicesOpen(false);
    setMobileOpen(false);
  }

  const isActive = (href: string) =>
    !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  const navLinkClass = (active: boolean) =>
    `relative flex h-full items-center px-3 text-sm font-medium transition-colors hover:text-white ${
      active
        ? "text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-sky-400"
        : "text-slate-300"
    }`;

  return (
    <>
      {/* Announcement strip */}
      <div className="bg-gradient-to-r from-[#0038b8] via-brand to-[#0e7490] text-white">
        <div className={`${containerClass} flex h-11 items-center justify-center gap-6 text-xs sm:text-sm lg:justify-between`}>
          <Link href="/get-started" className="group flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4 shrink-0 text-sky-200" aria-hidden="true" />
            <span>
              Website build from {formatMoney(site.pricing.setupFee)}, then {formatMoney(site.pricing.monthlyFee)}/month hosting
            </span>
            <span className="hidden items-center gap-1 font-semibold underline-offset-4 group-hover:underline sm:inline-flex">
              Get started <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>
          <div className="hidden items-center gap-5 text-white/85 lg:flex">
            {publicEmail ? (
              <a href={`mailto:${publicEmail}`} className="flex items-center gap-1.5 hover:text-white">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {publicEmail}
              </a>
            ) : (
              <Link href="/contact" className="flex items-center gap-1.5 hover:text-white">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                Send us a message
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header
        className={`sticky top-0 z-50 text-white transition-[background-color,box-shadow] duration-300 ${
          scrolled ? "bg-navy/80 shadow-lg shadow-black/25 backdrop-blur-xl" : "bg-navy"
        }`}
      >
        <div className={`${containerClass} flex h-[76px] items-center justify-between`}>
          <div className="flex h-full items-center gap-8">
            <Logo inverse />

            <nav className="hidden h-full items-center lg:flex" aria-label="Main">
              <div
                ref={servicesRef}
                className="h-full"
                onMouseEnter={openServices}
                onMouseLeave={scheduleCloseServices}
              >
                <button
                  type="button"
                  aria-expanded={servicesOpen}
                  aria-controls="services-menu"
                  onClick={() => setServicesOpen((value) => !value)}
                  className={`${navLinkClass(isActive("/services") || servicesOpen)} gap-1`}
                >
                  Services
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                {servicesOpen ? (
                  <div
                    id="services-menu"
                    className="menu-pop absolute inset-x-0 top-full border-y border-border bg-card text-foreground shadow-2xl shadow-black/30"
                  >
                    <div className={`${containerClass} grid gap-10 py-10 lg:grid-cols-12`}>
                      <div className="lg:col-span-8">
                        <p className="px-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Our services
                        </p>
                        <div className="mt-3 grid gap-1 sm:grid-cols-2">
                          {SERVICES.map((service) => (
                            <Link
                              key={service.id}
                              href={`/services#${service.id}`}
                              onClick={closeAll}
                              className="group flex gap-4 rounded-lg p-4 transition-colors hover:bg-muted"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-ink transition-colors group-hover:bg-brand group-hover:text-white">
                                <service.icon className="h-5 w-5" aria-hidden="true" />
                              </span>
                              <span>
                                <span className="flex items-center gap-2 font-semibold">
                                  {service.title}
                                  {!service.included ? (
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                      Quoted
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                                  {service.summary}
                                </span>
                              </span>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/services"
                          onClick={closeAll}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 text-sm font-semibold text-brand-ink hover:underline"
                        >
                          View all services <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>

                      <div className="bg-hero relative overflow-hidden rounded-xl p-7 text-white lg:col-span-4">
                        <svg
                          className="absolute -right-16 -top-16 h-56 w-56 text-sky-300/25"
                          viewBox="0 0 200 200"
                          aria-hidden="true"
                        >
                          <ellipse
                            cx="100"
                            cy="100"
                            rx="90"
                            ry="34"
                            fill="none"
                            stroke="currentColor"
                            transform="rotate(-25 100 100)"
                          />
                          <ellipse
                            cx="100"
                            cy="100"
                            rx="60"
                            ry="22"
                            fill="none"
                            stroke="currentColor"
                            transform="rotate(-25 100 100)"
                          />
                          <circle cx="100" cy="100" r="10" fill="currentColor" />
                        </svg>
                        <p className="relative text-xs font-semibold uppercase tracking-[0.12em] text-sky-300">
                          One simple plan
                        </p>
                        <p className="relative mt-3 text-3xl font-semibold tracking-tight">
                          {formatMoney(site.pricing.monthlyFee)}
                          <span className="text-base font-normal text-slate-300"> / month</span>
                        </p>
                        <p className="relative mt-2 text-sm leading-relaxed text-slate-300">
                          Plus {formatMoney(site.pricing.setupFee)} once-off setup. Hosting, SSL,
                          backups and support included.
                        </p>
                        <Link
                          href="/pricing"
                          onClick={closeAll}
                          className={buttonClasses("inverse", "sm", "relative mt-6")}
                        >
                          View pricing <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={navLinkClass(isActive(item.href))}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Client login
            </Link>
            <Link
              href="/contact"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Contact sales
            </Link>
            <ButtonLink href="/get-started" size="sm" className="shadow-lg shadow-brand/30">
              Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Glowing accent line */}
        <div
          className="h-px bg-gradient-to-r from-transparent via-sky-400/70 to-transparent"
          aria-hidden="true"
        />

        {mobileOpen ? (
          <nav
            id="mobile-nav"
            aria-label="Mobile"
            className="menu-pop max-h-[calc(100vh-76px)] overflow-y-auto border-t border-white/10 bg-navy px-4 pb-6 pt-4 lg:hidden"
          >
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Services
            </p>
            <ul className="mt-2 space-y-1">
              {SERVICES.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/services#${service.id}`}
                    onClick={closeAll}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-slate-200 hover:bg-white/10"
                  >
                    <service.icon className="h-5 w-5 text-sky-300" aria-hidden="true" />
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-1 border-t border-white/10 pt-4">
              {LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeAll}
                    className={`block rounded-md px-3 py-2.5 text-base font-medium hover:bg-white/10 ${
                      isActive(item.href) ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              onClick={closeAll}
              className="mt-4 flex items-center gap-3 rounded-md border-t border-white/10 px-3 pt-4 text-base font-medium text-slate-300 hover:text-white"
            >
              <LogIn className="h-5 w-5 text-sky-300" aria-hidden="true" />
              Client login
            </Link>
            <ButtonLink href="/get-started" className="mt-5 w-full" onClick={closeAll}>
              Get started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </nav>
        ) : null}
      </header>
    </>
  );
}
