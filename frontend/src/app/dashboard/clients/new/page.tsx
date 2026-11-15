import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NewClientForm } from "@/components/console/NewClientForm";
import { PageHeading } from "@/components/console/parts";
import { fetchAddOns, fetchPlans } from "@/lib/api";
import { fetchStaffOverview } from "@/lib/portal";
import { FALLBACK_ADDONS, FALLBACK_PLANS } from "@/lib/content";

// Per-request, like the rest of the console. See the note in layout.tsx.
export const instant = false;

export const metadata: Metadata = {
  title: "Add a client",
  robots: { index: false, follow: false },
};

export default async function NewClientPage() {
  // The console is owner-only, and this page creates logins, so the check
  // happens here as well as in the API rather than only in the API.
  const staff = await fetchStaffOverview();
  if (!staff.ok) redirect(staff.status === 403 ? "/account" : "/login");

  const [plans, addons] = await Promise.all([fetchPlans(), fetchAddOns()]);

  return (
    <>
      <PageHeading
        title="Add a client"
        lead="Creates their login and their portal account together, and shows the password once."
      />
      <div className="mt-8">
        <NewClientForm plans={plans ?? FALLBACK_PLANS} addons={addons ?? FALLBACK_ADDONS} />
      </div>
    </>
  );
}
