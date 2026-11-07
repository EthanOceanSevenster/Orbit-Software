"use client";

import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/Button";
import {
  Field,
  FieldGroup,
  FormAlert,
  FormSuccess,
  inputClass,
  selectClass,
} from "@/components/forms/shared";
import { postJson, type FieldErrors } from "@/lib/client-api";
import { DEFAULT_PLAN_SLUG } from "@/lib/site";

type Status = "idle" | "submitting" | "success";

const WEBSITE_TYPES = [
  { value: "business", label: "Business or brochure site" },
  { value: "ecommerce", label: "Online store" },
  { value: "portfolio", label: "Portfolio" },
  { value: "landing", label: "Landing page" },
  { value: "other", label: "Something else" },
];

export function GetStartedForm({ planSlug = DEFAULT_PLAN_SLUG }: { planSlug?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    setStatus("submitting");
    setMessage(null);
    setErrors({});

    const result = await postJson("/api/project-requests/", payload);
    if (result.ok) {
      setStatus("success");
      form.reset();
    } else {
      setStatus("idle");
      setMessage(result.message);
      setErrors(result.fieldErrors);
    }
  }

  if (status === "success") {
    return (
      <FormSuccess title="Request received">
        Thanks. We will email you shortly to talk through your website and the next steps.
        Nothing is charged until we have agreed the work.
      </FormSuccess>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-9" noValidate>
      {message ? <FormAlert kind="error">{message}</FormAlert> : null}
      <input type="hidden" name="plan" value={planSlug} />

      <FieldGroup step={1} title="How we reach you">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" name="name" errors={errors} required>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              placeholder="Jane Smith"
              className={inputClass}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
          <Field label="Email" name="email" errors={errors} required>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClass}
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" name="phone" errors={errors}>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+27 ..."
              className={inputClass}
              aria-invalid={Boolean(errors.phone)}
            />
          </Field>
          <Field label="Business name" name="company" errors={errors}>
            <input
              id="company"
              name="company"
              autoComplete="organization"
              placeholder="Your business"
              className={inputClass}
              aria-invalid={Boolean(errors.company)}
            />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup step={2} title="About the website">
        <Field label="What kind of website do you need?" name="website_type" errors={errors} required>
          <select
            id="website_type"
            name="website_type"
            className={selectClass}
            defaultValue="business"
            aria-invalid={Boolean(errors.website_type)}
          >
            {WEBSITE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Tell us about your project"
          name="details"
          errors={errors}
          hint="What does your business do, and what should the website help you achieve?"
        >
          <textarea
            id="details"
            name="details"
            rows={5}
            className={inputClass}
            placeholder="A few sentences is plenty. We will ask the rest when we talk."
            aria-invalid={Boolean(errors.details)}
          />
        </Field>
      </FieldGroup>

      <div className="border-t border-border pt-7">
        <Button type="submit" size="lg" disabled={status === "submitting"} className="w-full sm:w-auto">
          {status === "submitting" ? "Sending..." : "Send request"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          No payment is taken now. We confirm the details with you before any work starts.
        </p>
      </div>
    </form>
  );
}
