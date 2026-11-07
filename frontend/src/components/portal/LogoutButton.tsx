"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { logout } from "@/lib/portal-client";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
