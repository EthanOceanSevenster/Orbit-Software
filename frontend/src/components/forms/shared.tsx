import { CircleAlert, CircleCheck } from "lucide-react";
import type { ReactNode } from "react";

import type { FieldErrors } from "@/lib/client-api";

/** Shared input styling. Inputs, selects and textareas all use this. */
export const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/70 hover:border-muted-foreground/40 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-red-500/15";

/** Select needs extra right padding for the chevron drawn behind it. */
export const selectClass = `${inputClass} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11 bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')]`;

/** Groups related fields under a small heading, so a long form reads as steps. */
export function FieldGroup({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-5 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-ink">
          {step}
        </span>
        <span className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {title}
        </span>
      </legend>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

export function Field({
  label,
  name,
  errors,
  required,
  hint,
  children,
}: {
  label: string;
  name: string;
  errors: FieldErrors;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  const fieldErrors = errors[name];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
        {!required ? (
          <span className="text-xs text-muted-foreground">Optional</span>
        ) : null}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {fieldErrors?.length ? (
        <p id={`${name}-error`} className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {fieldErrors[0]}
        </p>
      ) : null}
    </div>
  );
}

export function FormAlert({
  kind,
  children,
}: {
  kind: "success" | "error";
  children: ReactNode;
}) {
  const success = kind === "success";
  const styles = success
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
    : "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200";
  const Icon = success ? CircleCheck : CircleAlert;
  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm ${styles}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/** Shown after a successful submit, in place of the form. */
export function FormSuccess({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-6 py-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
        <CircleCheck className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
