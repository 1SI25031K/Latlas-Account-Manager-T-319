"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message || "ログインに失敗しました。");
      return;
    }
    router.push("/account");
    router.refresh();
  }

  const inputClass =
    "mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-600/30";
  const inputStyle = {
    borderColor: "var(--dashboard-border)",
    backgroundColor: "var(--dashboard-bg)",
    color: "var(--dashboard-text)",
  } as const;

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label className="text-sm font-medium" style={{ color: "var(--dashboard-text)" }}>
          メールアドレス
        </label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>
      <div>
        <label className="text-sm font-medium" style={{ color: "var(--dashboard-text)" }}>
          パスワード
        </label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
