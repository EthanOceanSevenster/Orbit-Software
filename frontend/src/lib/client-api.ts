/**
 * Browser-side helper for posting forms to the Django API.
 */
export const PUBLIC_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export type FieldErrors = Record<string, string[]>;

export type PostResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors: FieldErrors };

function normaliseErrors(data: unknown): FieldErrors {
  if (!data || typeof data !== "object") return {};
  const out: FieldErrors = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (Array.isArray(value)) out[key] = value.map(String);
    else if (typeof value === "string") out[key] = [value];
  }
  return out;
}

export async function postJson(path: string, body: unknown): Promise<PostResult> {
  try {
    const res = await fetch(`${PUBLIC_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };

    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      const fieldErrors = normaliseErrors(data);
      const general = fieldErrors.non_field_errors?.[0] ?? fieldErrors.detail?.[0];
      return {
        ok: false,
        message: general ?? "Please check the highlighted fields and try again.",
        fieldErrors,
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        message: "Too many submissions from this network. Please try again later.",
        fieldErrors: {},
      };
    }
    return {
      ok: false,
      message: "Something went wrong on our side. Please try again or email us directly.",
      fieldErrors: {},
    };
  } catch {
    return {
      ok: false,
      message: "We could not reach the server. Please check your connection and try again.",
      fieldErrors: {},
    };
  }
}
