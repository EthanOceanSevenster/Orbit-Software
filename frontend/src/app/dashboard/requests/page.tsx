import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeading, Panel, RequestsList } from "@/components/console/parts";
import { fetchStaffOverview } from "@/lib/portal";

// Per-request, like the rest of the console. See the note in layout.tsx.
export const instant = false;

export const metadata: Metadata = {
  title: "Requests",
  robots: { index: false, follow: false },
};

export default async function RequestsPage() {
  const result = await fetchStaffOverview();
  if (!result.ok) redirect(result.status === 403 ? "/account" : "/login");

  const { requests } = result.data;

  return (
    <>
      <PageHeading
        title="Requests"
        lead="Work clients have asked for from their own page, and where each one stands."
      />

      <Panel title="Waiting on you">
        <RequestsList requests={requests} />
      </Panel>

      <p className="mt-5 text-sm text-muted-foreground">
        Change a request&rsquo;s status under Service requests in the Django admin. The
        client sees that status on their own page, so moving it to Quoted or In progress
        is how you tell them where it stands without writing an email.
      </p>
    </>
  );
}
