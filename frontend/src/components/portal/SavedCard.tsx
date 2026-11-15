"use client";

import { CreditCard, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { savePayfastCard, updateSavedCard } from "@/lib/portal-client";
import type { SavedCard as SavedCardState } from "@/lib/types";

/**
 * Save a card once, and stop thinking about the monthly invoice.
 *
 * Nothing about the card is stored here or on our server. The client types
 * it on Payfast's own page and we are handed a token, which is what gets
 * charged. That is worth saying on the page, because "let us keep your card"
 * is a reasonable thing for somebody to be wary of.
 *
 * The consent wording is shown before they agree and kept afterwards, so
 * what they were asked is never in question.
 */
export function SavedCard({
  card,
  companyName,
}: {
  card: SavedCardState;
  companyName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"save" | "autopay" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy("save");
    setError(null);
    const result = await savePayfastCard();
    // On success the browser is already on its way to Payfast, so there is
    // nothing to reset: leaving it spinning is the honest state.
    if (!result.ok) {
      setError(result.message ?? "That did not work.");
      setBusy(null);
    }
  }

  async function change(next: { autopay: boolean } | "remove") {
    setBusy(next === "remove" ? "remove" : "autopay");
    setError(null);
    const result = await updateSavedCard(next);
    if (!result.ok) setError(result.message ?? "That did not save.");
    setBusy(null);
    router.refresh();
  }

  const savedOn = card.saved_at
    ? new Date(card.saved_at).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
          <CreditCard className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">
            {card.has_card ? "Your saved card" : "Pay automatically each month"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {card.has_card
              ? `Saved on ${savedOn}. We charge it when your invoice is raised.`
              : "Save a card once and your monthly invoice pays itself."}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {card.has_card ? (
        <>
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-muted px-4 py-3.5">
            <div>
              <p className="text-sm font-medium">Automatic payment</p>
              <p className="text-xs text-muted-foreground">
                {card.autopay
                  ? "On. Nothing for you to do each month."
                  : "Off. You pay each invoice yourself."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={card.autopay}
              disabled={busy !== null}
              onClick={() => change({ autopay: !card.autopay })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                card.autopay ? "bg-brand" : "bg-border"
              }`}
            >
              <span className="sr-only">
                {card.autopay ? "Turn automatic payment off" : "Turn automatic payment on"}
              </span>
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  card.autopay ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {card.update_url ? (
              <a
                href={card.update_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand-ink"
              >
                Change the card
              </a>
            ) : null}
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => change("remove")}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-red-500/50 hover:text-red-600 disabled:opacity-50"
            >
              {busy === "remove" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              Remove it
            </button>
          </div>

          {card.consent_text ? (
            <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              You agreed: &ldquo;{card.consent_text}&rdquo;
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="mt-6 rounded-xl border border-border bg-muted p-4 text-sm leading-relaxed text-muted-foreground">
            I authorise {companyName} to charge this card for my monthly invoice on or
            after the first of each month, for as long as my account is active. I can
            remove the card at any time from this page.
          </p>

          <button
            type="button"
            onClick={start}
            disabled={busy !== null}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {busy === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CreditCard className="h-4 w-4" aria-hidden="true" />
            )}
            Agree and save my card
          </button>

          <p className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
            You enter the card on Payfast&rsquo;s own page. {companyName} never sees the
            number and never stores it &mdash; we are handed a token we can charge, and
            nothing else.
          </p>
        </>
      )}
    </section>
  );
}
