"use client";

import { LogOut } from "iconoir-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:opacity-90 disabled:opacity-50"
      style={{ color: "var(--dashboard-text-muted)" }}
    >
      <LogOut width={18} height={18} strokeWidth={1.5} />
      {loading ? "ログアウト中…" : "ログアウト"}
    </button>
  );
}
