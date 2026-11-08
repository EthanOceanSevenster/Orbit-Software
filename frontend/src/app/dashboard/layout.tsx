import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ConsoleShell } from "@/components/console/ConsoleShell";
import { fetchStaffOverview } from "@/lib/portal";

/**
 * Nothing under /dashboard can be prerendered: every figure belongs to the
 * signed-in owner, and the session is only known per request. Rather than wrap
 * each page in a Suspense boundary whose fallback nobody would see, the
 * segment is declared blocking, which is what it honestly is.
 */
export const instant = false;

/**
 * The owner's console.
 *
 * Access is checked here rather than on each page, so a new page added under
 * /dashboard is closed by default instead of open by accident. The API checks
 * again on every call, which is the check that actually matters.
 */

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const result = await fetchStaffOverview();
  if (!result.ok) {
    // 403 is a signed-in client who is not staff. Their own page is where
    // they belong. Anything else means there is no session at all.
    redirect(result.status === 403 ? "/account" : "/login");
  }

  const { totals } = result.data;

  return (
    <ConsoleShell
      clientCount={totals.clients}
      openRequests={totals.open_requests}
      unpaidInvoices={totals.unpaid_invoices}
    >
      {children}
    </ConsoleShell>
  );
}
