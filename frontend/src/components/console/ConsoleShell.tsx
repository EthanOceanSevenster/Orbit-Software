"use client";

import {
  Banknote,
  Inbox,
  LayoutDashboard,
  Menu,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/portal/LogoutButton";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number };

export function ConsoleShell({
  children,
  openRequests = 0,
  unpaidInvoices = 0,
  clientCount = 0,
}: {
  children: ReactNode;
  openRequests?: number;
  unpaidInvoices?: number;
  clientCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/clients", label: "Clients", icon: Users, badge: clientCount },
    { href: "/dashboard/payments", label: "Payments", icon: Banknote, badge: unpaidInvoices },
    { href: "/dashboard/requests", label: "Requests", icon: Inbox, badge: openRequests },
  ];

  // Exact match for the overview, prefix for the rest. Without this, every
  // item would light up on every page, because they all start with /dashboard.
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const nav = (
    <nav className="space-y-1" aria-label="Dashboard">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <item.icon
              className={`h-4.5 w-4.5 shrink-0 ${active ? "text-sky-300" : ""}`}
              aria-hidden="true"
            />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  active ? "bg-sky-400/20 text-sky-200" : "bg-white/10 text-slate-300"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Sidebar, fixed on wide screens */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-navy lg:flex">
        <div className="flex h-[76px] items-center border-b border-white/10 px-6">
          <Logo inverse />
        </div>
        <div className="flex-1 overflow-y-auto p-4">{nav}</div>
        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Back to the website
          </Link>
          <div className="mt-2 px-1">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Narrow screens: a drawer, because 64 columns of sidebar leaves no room */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="menu-pop absolute inset-y-0 left-0 flex w-72 flex-col bg-navy">
            <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5">
              <Logo inverse />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{nav}</div>
            <div className="border-t border-white/10 p-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
              >
                Back to the website
              </Link>
              <div className="mt-2 px-1">
                <LogoutButton />
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-40 flex h-[76px] items-center gap-4 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {items.find((i) => isActive(i.href))?.label ?? "Dashboard"}
          </p>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
