"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/Button";
import { Field, FormAlert, inputClass } from "@/components/forms/shared";
import type { FieldErrors } from "@/lib/client-api";
import { register } from "@/lib/portal-client";

export function RegisterForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    // Checked here rather than on the server: the second box never leaves the
    // browser, so there is nothing for the API to compare it against.
    if (password !== confirm) {
      setErrors({ confirm: ["Those two passwords do not match."] });
      setMessage("Please check the highlighted fields and try again.");
      return;
    }

    setStatus("submitting");
    setMessage(null);
    setErrors({});

    const result = await register({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      company_name: String(data.get("company_name") ?? ""),
      password,
    });

    if (result.ok) {
      // Registering signs them in, so send them straight to their account.
      // refresh() re-runs the server components against the new session.
      router.replace("/account");
      router.refresh();
      return;
    }

    setStatus("idle");
    setMessage(result.message);
    setErrors(result.fieldErrors);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {message ? <FormAlert kind="error">{message}</FormAlert> : null}

      <Field label="Your name" name="name" errors={errors} required>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          autoFocus
          placeholder="Phakama Ndamase"
          aria-invalid={errors.name ? true : undefined}
          className={inputClass}
        />
      </Field>

      <Field
        label="Business name"
        name="company_name"
        errors={errors}
        hint="Leave this blank and we will use your own name."
      >
        <input
          id="company_name"
          name="company_name"
          type="text"
          autoComplete="organization"
          placeholder="Your business"
          aria-invalid={errors.company_name ? true : undefined}
          className={inputClass}
        />
      </Field>

      <Field label="Email" name="email" errors={errors} required>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourbusiness.co.za"
          aria-invalid={errors.email ? true : undefined}
          className={inputClass}
        />
      </Field>

      <Field
        label="Password"
        name="password"
        errors={errors}
        required
        hint="At least 8 characters, and not something easy to guess."
      >
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Choose a password"
            aria-invalid={errors.password ? true : undefined}
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>

      <Field label="Confirm password" name="confirm" errors={errors} required>
        <input
          id="confirm"
          name="confirm"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          placeholder="Type it again"
          aria-invalid={errors.confirm ? true : undefined}
          className={inputClass}
        />
      </Field>

      <Button type="submit" size="lg" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Creating your profile..." : "Create my profile"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <LockKeyhole className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        No card needed. You only pay once we have agreed on the work.
      </p>
    </form>
  );
}
