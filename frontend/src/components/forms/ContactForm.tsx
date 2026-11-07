"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/Button";
import { Field, FormAlert, FormSuccess, inputClass } from "@/components/forms/shared";
import { postJson, type FieldErrors } from "@/lib/client-api";

type Status = "idle" | "submitting" | "success";

export function ContactForm() {
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

    const result = await postJson("/api/contact/", payload);
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
      <FormSuccess title="Message sent">
        Thanks for getting in touch. We will reply by email shortly.
      </FormSuccess>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {message ? <FormAlert kind="error">{message}</FormAlert> : null}

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

      <Field label="Message" name="message" errors={errors} required>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className={inputClass}
          placeholder="Tell us a little about what you need."
          aria-invalid={Boolean(errors.message)}
        />
      </Field>

      <div className="border-t border-border pt-5">
        <Button type="submit" size="lg" disabled={status === "submitting"} className="w-full sm:w-auto">
          {status === "submitting" ? "Sending..." : "Send message"}
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
