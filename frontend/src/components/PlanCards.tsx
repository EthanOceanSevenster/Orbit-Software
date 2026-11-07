import { PricingCard } from "@/components/PricingCard";
import { fetchAddOns, fetchPlans } from "@/lib/api";
import { FALLBACK_ADDONS, FALLBACK_PLANS } from "@/lib/content";

/**
 * Server Component. Fetches plans from the Django API at request time and
 * falls back to the static plan list if the API is unavailable.
 * Render inside <Suspense> so the rest of the page is served from the static shell.
 */
export async function PlanCards() {
  const [fetchedPlans, fetchedAddons] = await Promise.all([fetchPlans(), fetchAddOns()]);
  const plans = fetchedPlans ?? FALLBACK_PLANS;
  const addons = fetchedAddons ?? FALLBACK_ADDONS;
  const showBadge = plans.length > 1;

  return (
    <div className="grid justify-center gap-6 grid-cols-[repeat(auto-fit,minmax(280px,440px))]">
      {plans.map((plan) => (
        <PricingCard
          key={plan.slug}
          plan={plan}
          addons={addons}
          highlight={showBadge && plan.is_featured}
        />
      ))}
    </div>
  );
}

export function PlanCardsSkeleton() {
  return (
    <div className="grid justify-center gap-6 grid-cols-[repeat(auto-fit,minmax(280px,440px))]">
      <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-1.5 bg-muted" />
        <div className="p-8">
          <div className="h-6 w-1/2 rounded bg-muted" />
          <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-8 h-12 w-1/2 rounded bg-muted" />
          <div className="mt-5 h-11 w-full rounded-lg bg-muted" />
          <div className="mt-6 h-12 w-full rounded-md bg-muted" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
