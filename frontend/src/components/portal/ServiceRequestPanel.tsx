"use client";

import { ClipboardList, Plus, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/Button";
import { Field, FormAlert, inputClass, selectClass } from "@/components/forms/shared";
import type { FieldErrors } from "@/lib/client-api";
import { requestService } from "@/lib/portal-client";
import { SERVICE_OPTIONS, type ServiceRequest } from "@/lib/types";

/** Colour by where the request stands, so the list scans at a glance. */
const STATUS_STYLES: Record<ServiceRequest["status"], string> = {
  new: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  quoted: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  accepted: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  declined: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ServiceRequestPanel({
  requests,
  openByDefault = false,
}: {
  requests: ServiceRequest[];
  openByDefault?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(openByDefault);
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("submitting");
    setMessage(null);
    setErrors({});

    const result = await requestService(
      String(data.get("service") ?? ""),
      String(data.get("details") ?? ""),
    );

    if (result.ok) {
      form.reset();
      setStatus("sent");
      setOpen(false);
      setMessage(null);
      // Re-runs the server component so the new request appears in the list
      // below without a full page load.
      router.refresh();
      return;
    }

    setStatus("idle");
    setMessage(result.message);
    setErrors(result.fieldErrors);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-7 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Request a service</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tell us what you need and we will come back to you with a quote.
          </p>
        </div>
        <Button
          type="button"
          variant={open ? "ghost" : "primary"}
          size="sm"
          onClick={() => {
            setOpen((v) => !v);
            setMessage(null);
            setStatus("idle");
          }}
        >
          {open ? (
            <>
              <X className="h-4 w-4" aria-hidden="true" /> Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden="true" /> New request
            </>
          )}
        </Button>
      </div>

      {status === "sent" && !open ? (
        <div className="mt-6">
          <FormAlert kind="success">
            Request sent. We will be in touch by email, and you can follow it below.
          </FormAlert>
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          {message ? <FormAlert kind="error">{message}</FormAlert> : null}

          <Field label="What do you need?" name="service" errors={errors} required>
            <select
              id="service"
              name="service"
              required
              defaultValue=""
              aria-invalid={errors.service ? true : undefined}
              className={selectClass}
            >
              <option value="" disabled>
                Choose a service
              </option>
              {SERVICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Tell us a bit more"
            name="details"
            errors={errors}
            hint="What you are after, roughly when you need it, anything else useful."
          >
            <textarea
              id="details"
              name="details"
              rows={5}
              placeholder="We would like a dashboard showing our monthly sales and stock levels."
              aria-invalid={errors.details ? true : undefined}
              className={inputClass}
            />
          </Field>

          <Button type="submit" disabled={status === "submitting"} className="w-full sm:w-auto">
            {status === "submitting" ? "Sending..." : "Send request"}
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      ) : null}

      <div className="mt-7 border-t border-border pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList className="h-4 w-4 text-brand-ink" aria-hidden="true" />
          Your requests
        </h3>

        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You have not asked for anything yet. Whatever you send us will show up
            here with its progress.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {requests.map((request) => (
              <li
                key={request.id}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{request.service_label}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLES[request.status] ?? STATUS_STYLES.new
                    }`}
                  >
                    {request.status_label}
                  </span>
                </div>
                {request.details ? (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {request.details}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Sent {formatDate(request.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
