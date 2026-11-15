"use client";

import { Check, Copy, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createClient, type CreatedClient } from "@/lib/portal-client";
import type { AddOn, Plan } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground/60 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

/**
 * Adding a client, from the console rather than a shell.
 *
 * The password is generated unless one is typed, and it comes back exactly
 * once in the response. There is no way to read it afterwards, so this shows
 * it on screen with a copy button and says plainly that it will not be shown
 * again.
 */
export function NewClientForm({ plans, addons }: { plans: Plan[]; addons: AddOn[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedClient | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setBusy(true);
    setError(null);

    const result = await createClient({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      company: String(form.get("company") ?? ""),
      phone: String(form.get("phone") ?? ""),
      website: String(form.get("website") ?? ""),
      domain: String(form.get("domain") ?? ""),
      plan: String(form.get("plan") ?? ""),
      addons: form.getAll("addons").map(String),
      monthly: String(form.get("monthly") ?? ""),
      next_payment_date: String(form.get("next_payment_date") ?? ""),
      password: String(form.get("password") ?? ""),
      first_invoice: form.get("first_invoice") === "on",
      setup_fee: form.get("setup_fee") === "on",
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCreated(result.client);
    router.refresh();
  }

  if (created) {
    return (
      <div className="rounded-2xl border border-border bg-card p-7">
        <h2 className="text-lg font-semibold">{created.company_name} is set up</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {created.plan_name || "No plan"}
          {created.addons.length > 0 ? ` · ${created.addons.join(", ")}` : ""} ·{" "}
          {created.currency} {created.monthly_total} a month
          {created.invoice
            ? ` · invoice ${created.invoice.number} for ${created.currency} ${created.invoice.amount}`
            : ""}
        </p>

        <div className="mt-6 rounded-xl border border-border bg-muted p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Their login
          </p>
          <p className="mt-3 font-mono text-sm">{created.email}</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="font-mono text-sm">{created.password}</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `${created.email}\n${created.password}`,
                );
                setCopied(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:border-brand hover:text-brand-ink"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy both"}
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            This password is shown once and cannot be read back. Send it over
            WhatsApp rather than email, and ask them to change it after signing in.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setCopied(false);
            }}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand-hover"
          >
            Add another
          </button>
          <Link
            href="/dashboard/clients"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:border-brand hover:text-brand-ink"
          >
            Back to clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error ? (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
        <h2 className="font-semibold">Who they are</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Full name" name="name" required>
            <input id="name" name="name" required className={inputClass} placeholder="Jane Dlamini" />
          </Field>
          <Field label="Business name" name="company" hint="Defaults to their name.">
            <input id="company" name="company" className={inputClass} placeholder="Dlamini Plumbing" />
          </Field>
          <Field label="Email, which is also their username" name="email" required>
            <input id="email" name="email" type="email" required className={inputClass} placeholder="jane@example.co.za" />
          </Field>
          <Field label="Phone" name="phone">
            <input id="phone" name="phone" className={inputClass} placeholder="082 123 4567" />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
        <h2 className="font-semibold">Their website</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Live site" name="website" hint="The address you built for them.">
            <input id="website" name="website" className={inputClass} placeholder="https://example.co.za" />
          </Field>
          <Field label="Domain we renew" name="domain" hint="Leave blank if they own it elsewhere.">
            <input id="domain" name="domain" className={inputClass} placeholder="example.co.za" />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
        <h2 className="font-semibold">What they pay</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Plan" name="plan">
            <select id="plan" name="plan" className={inputClass} defaultValue={plans[0]?.slug ?? ""}>
              <option value="">No plan</option>
              {plans.map((plan) => (
                <option key={plan.slug} value={plan.slug}>
                  {plan.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Monthly override"
            name="monthly"
            hint="Only if they pay something other than the plan plus add-ons."
          >
            <input id="monthly" name="monthly" inputMode="decimal" className={inputClass} placeholder="e.g. 250" />
          </Field>
        </div>

        {addons.length > 0 ? (
          <fieldset className="mt-5">
            <legend className="text-sm font-medium">Add-ons</legend>
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {addons.map((addon) => (
                <label
                  key={addon.slug}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm"
                >
                  <input
                    type="checkbox"
                    name="addons"
                    value={addon.slug}
                    className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
                  />
                  <span>
                    <span className="font-medium">{addon.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {addon.currency} {addon.monthly_fee}/mo
                      {Number(addon.setup_fee ?? 0) > 0
                        ? ` plus ${addon.currency} ${addon.setup_fee} once-off`
                        : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Next payment date" name="next_payment_date" hint="Defaults to a month from today.">
            <input id="next_payment_date" name="next_payment_date" type="date" className={inputClass} />
          </Field>
          <Field label="Password" name="password" hint="Leave blank and one is generated.">
            <input id="password" name="password" className={inputClass} placeholder="Generated" />
          </Field>
        </div>

        <div className="mt-5 grid gap-2 lg:grid-cols-2">
          <label className="flex items-start gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm">
            <input type="checkbox" name="first_invoice" className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
            <span>
              <span className="font-medium">Raise their first invoice now</span>
              <span className="block text-muted-foreground">Due in seven days.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm">
            <input type="checkbox" name="setup_fee" className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
            <span>
              <span className="font-medium">Include the setup fees on it</span>
              <span className="block text-muted-foreground">
                The plan&rsquo;s once-off fee and any add-on setup fees.
              </span>
            </span>
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Creating..." : "Create the client"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  hint,
  required,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex h-6 items-baseline justify-between gap-3">
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
        {!required ? <span className="text-xs text-muted-foreground">Optional</span> : null}
      </div>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
