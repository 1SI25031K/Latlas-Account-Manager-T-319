"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SectionTitle } from "@/components/SectionTitle";

const cardClass = "rounded-2xl border p-6 shadow-sm";
const cardStyle = {
  backgroundColor: "var(--dashboard-card)",
  borderColor: "var(--dashboard-border)",
} as const;
const inputClass =
  "mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-600/30";
const inputStyle = {
  borderColor: "var(--dashboard-border)",
  backgroundColor: "var(--dashboard-bg)",
  color: "var(--dashboard-text)",
} as const;
const labelClass = "text-sm font-medium";
const labelStyle = { color: "var(--dashboard-text)" } as const;

export function SecuritySection({ user }: { user: User }) {
  const supabase = useMemo(() => createClient(), []);
  const email = user.email ?? "";

  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const submitEmailChange = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setEmailMsg(null);
      const trimmed = newEmail.trim();
      if (!trimmed || trimmed === user.email) {
        setEmailMsg({ type: "err", text: "新しいメールアドレスを入力してください。" });
        return;
      }
      setEmailLoading(true);
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      setEmailLoading(false);
      if (error) {
        setEmailMsg({ type: "err", text: error.message || "メールの更新に失敗しました。" });
        return;
      }
      setEmailMsg({
        type: "ok",
        text: "確認メールを送信しました。メール内のリンクを開くと変更が完了します。",
      });
      setNewEmail("");
    },
    [newEmail, supabase.auth, user.email]
  );

  const submitPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPwMsg(null);
      if (newPassword.length < 8) {
        setPwMsg({ type: "err", text: "パスワードは8文字以上にしてください。" });
        return;
      }
      if (newPassword !== confirmPassword) {
        setPwMsg({ type: "err", text: "パスワードが一致しません。" });
        return;
      }
      setPwLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setPwLoading(false);
      setNewPassword("");
      setConfirmPassword("");
      if (error) {
        setPwMsg({ type: "err", text: error.message || "パスワードの更新に失敗しました。" });
        return;
      }
      setPwMsg({ type: "ok", text: "パスワードを更新しました。" });
    },
    [confirmPassword, newPassword, supabase.auth]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-heading-ja text-2xl font-semibold" style={{ color: "var(--dashboard-text)" }}>
          セキュリティとログイン
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
          メールアドレスとパスワードを変更します。
        </p>
      </div>

      <section className={cardClass} style={cardStyle}>
        <SectionTitle>ログイン（メール）</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
          現在のメール: <strong style={{ color: "var(--dashboard-text)" }}>{email}</strong>
        </p>
        <form onSubmit={submitEmailChange} className="space-y-3">
          <div>
            <label className={labelClass} style={labelStyle}>
              新しいメールアドレス
            </label>
            <input
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="new@example.com"
            />
          </div>
          {emailMsg ? (
            <p className={`text-sm ${emailMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
              {emailMsg.text}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={emailLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {emailLoading ? "送信中…" : "メール変更を依頼する"}
          </button>
        </form>
      </section>

      <section className={cardClass} style={cardStyle}>
        <SectionTitle>パスワード</SectionTitle>
        <form onSubmit={submitPassword} className="space-y-3">
          <div>
            <label className={labelClass} style={labelStyle}>
              新しいパスワード
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>
              パスワード（確認）
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          {pwMsg ? (
            <p className={`text-sm ${pwMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
              {pwMsg.text}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pwLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {pwLoading ? "更新中…" : "パスワードを更新"}
          </button>
        </form>
      </section>
    </div>
  );
}
