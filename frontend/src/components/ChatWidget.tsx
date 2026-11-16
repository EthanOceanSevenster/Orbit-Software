"use client";

import { Check, Loader2, MessageSquare, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { postJson } from "@/lib/client-api";
import { site } from "@/lib/site";

/**
 * The thing in the corner that turns a visitor into an email.
 *
 * It asks, in order: what they want, a detail about it, their name and their
 * email. Then it sends the whole exchange to the contact endpoint, which is
 * the same one the contact form uses, so the enquiry lands in the same inbox
 * and the same admin list.
 *
 * Deliberately scripted rather than a language model. A business that cannot
 * yet answer its own email does not need an AI that invents prices, and a
 * four-question script converts a stranger just as well while being
 * incapable of promising something we do not sell.
 */
type Role = "bot" | "them";
type Line = { role: Role; text: string };

type Step = "what" | "detail" | "name" | "email" | "sending" | "done";

const WANTS = [
  { id: "website", label: "A website", follow: "Do you have one already?" },
  { id: "dashboard", label: "A dashboard or report", follow: "Where does the data live at the moment?" },
  { id: "automation", label: "Automating a job I do by hand", follow: "Which job eats the most time?" },
  { id: "other", label: "Something else", follow: "Tell me a little about it." },
];

const FOLLOW_CHOICES: Record<string, string[]> = {
  website: ["No, starting fresh", "Yes, it needs replacing", "Yes, it needs changes"],
  dashboard: ["Spreadsheets", "A till or accounting system", "A website or app", "Not sure"],
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("what");
  const [want, setWant] = useState<(typeof WANTS)[number] | null>(null);
  const [lines, setLines] = useState<Line[]>([
    { role: "bot", text: `Hi. I am the ${site.name} assistant. What are you after?` },
  ]);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest line in view as the exchange grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines, step]);

  function say(role: Role, text: string) {
    setLines((current) => [...current, { role, text }]);
  }

  function chooseWant(choice: (typeof WANTS)[number]) {
    setWant(choice);
    setAnswers({ want: choice.label });
    say("them", choice.label);
    say("bot", choice.follow);
    setStep("detail");
  }

  function answerDetail(text: string) {
    const value = text.trim();
    if (!value) return;
    setAnswers((current) => ({ ...current, detail: value }));
    say("them", value);
    say("bot", "Thanks. What is your name?");
    setDraft("");
    setStep("name");
  }

  function answerName(text: string) {
    const value = text.trim();
    if (!value) return;
    setAnswers((current) => ({ ...current, name: value }));
    say("them", value);
    say("bot", `Good to meet you, ${value.split(" ")[0]}. What email should the reply go to?`);
    setDraft("");
    setStep("email");
  }

  async function answerEmail(text: string) {
    const value = text.trim();
    if (!value.includes("@") || !value.includes(".")) {
      setError("That does not look like an email address.");
      return;
    }
    setError(null);
    say("them", value);
    setDraft("");
    setStep("sending");

    const message = [
      "Asked through the chat assistant on the website.",
      "",
      `Looking for: ${answers.want ?? "-"}`,
      `${want?.follow ?? "Detail"} ${answers.detail ?? "-"}`,
    ].join("\n");

    const result = await postJson("/api/contact/", {
      name: answers.name ?? "Someone",
      email: value,
      company: "",
      message,
    });

    if (!result.ok) {
      setError(result.message);
      setStep("email");
      return;
    }

    say(
      "bot",
      "Got it. That has gone through and you will get a reply by email, usually the same day.",
    );
    setStep("done");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (step === "detail") answerDetail(draft);
    else if (step === "name") answerName(draft);
    else if (step === "email") void answerEmail(draft);
  }

  const typing = step === "sending";
  const showChoices = step === "detail" && want ? FOLLOW_CHOICES[want.id] : undefined;

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-4 z-50 flex max-h-[min(34rem,calc(100vh-8rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40 sm:right-6">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Ask {site.name}</p>
              <p className="text-xs text-muted-foreground">
                Four questions, then I email the developer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the chat"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {lines.map((line, index) => (
              <p
                key={`${index}-${line.text.slice(0, 12)}`}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  line.role === "bot"
                    ? "bg-muted text-foreground"
                    : "ml-auto bg-brand text-brand-foreground"
                }`}
              >
                {line.text}
              </p>
            ))}

            {step === "what" ? (
              <div className="grid gap-2 pt-1">
                {WANTS.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => chooseWant(choice)}
                    className="rounded-xl border border-border px-3.5 py-2.5 text-left text-sm transition-colors hover:border-brand hover:text-brand-ink"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            ) : null}

            {showChoices ? (
              <div className="grid gap-2 pt-1">
                {showChoices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => answerDetail(choice)}
                    className="rounded-xl border border-border px-3.5 py-2.5 text-left text-sm transition-colors hover:border-brand hover:text-brand-ink"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            ) : null}

            {typing ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Sending it through
              </p>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            ) : null}

            {step === "done" ? (
              <p className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Sent
              </p>
            ) : null}

            <div ref={endRef} />
          </div>

          {step === "detail" || step === "name" || step === "email" ? (
            <form onSubmit={onSubmit} className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  autoFocus
                  type={step === "email" ? "email" : "text"}
                  placeholder={
                    step === "email"
                      ? "you@yourbusiness.co.za"
                      : step === "name"
                        ? "Your name"
                        : "Type your answer"
                  }
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  className="shrink-0 rounded-lg bg-brand p-2.5 text-brand-foreground hover:bg-brand-hover"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {step === "email" ? (
                <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                  Used to reply to this enquiry and nothing else.
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close the chat" : "Ask a question"}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-xl shadow-brand/30 transition-transform hover:scale-105 sm:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </>
  );
}
