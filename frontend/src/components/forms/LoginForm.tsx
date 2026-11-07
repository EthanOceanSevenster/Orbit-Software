"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/Button";
import { Field, FormAlert, inputClass } from "@/components/forms/shared";
import { login } from "@/lib/portal-client";

export function LoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    setStatus("submitting");
    setMessage(null);

    const result = await login(email, password);
    if (result.ok) {
      // refresh() re-runs the server components so the portal reads the new
      // session straight away instead of showing a stale signed-out view.
      router.replace("/account");
      router.refresh();
      return;
    }
    setStatus("idle");
    setMessage(result.message);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {message ? <FormAlert kind="error">{message}</FormAlert> : null}

      <Field label="Email" name="email" errors={{}} required>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          className={inputClass}
        />
      </Field>

      <Field label="Password" name="password" errors={{}} required>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="Your password"
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

      <Button type="submit" size="lg" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Signing in..." : "Sign in"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
        Your session is stored in a secure cookie, never in the page.
      </p>
    </form>
  );
}
