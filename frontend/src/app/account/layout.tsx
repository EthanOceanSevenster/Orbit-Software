import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell, type NavItem } from "@/components/app/AppShell";
import { fetchMyAccount, fetchMyInvoices } from "@/lib/portal";

/**
 * Same reasoning as the console: every figure here belongs to the signed-in
 * client, so none of it can be prerendered.
 */
export const instant = false;

/**
 * The client portal.
 *
 * Signing in is checked here, so a page added under /account is closed by
 * default rather than open by accident. The API checks again on every call,
 * which is the check that actually protects anything.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const account = await fetchMyAccount();
  if (!account.ok) redirect("/login");

  // The owner's own login has no client account behind it, so this page would
  // otherwise tell them to get in touch with themselves.
  if (account.data.is_staff && !account.data.has_account) redirect("/dashboard");

  const invoices = await fetchMyInvoices();
  const toPay = invoices.ok ? invoices.data.filter((i) => i.is_payable).length : 0;

  const items: NavItem[] = [
    { href: "/account", label: "Overview", icon: "overview", exact: true },
    { href: "/account/website", label: "My website", icon: "website" },
    { href: "/account/services", label: "Services", icon: "services" },
    { href: "/account/billing", label: "Billing", icon: "billing", badge: toPay },
    { href: "/account/support", label: "Support", icon: "support" },
  ];

  return (
    <AppShell items={items} eyebrow="Your account">
      {children}
    </AppShell>
  );
}
