"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useMemo, useState } from "react";
import { MediaImage } from "iconoir-react";
import { createClient } from "@/lib/supabase/client";
import { buildProfileInsertPayload, buildProfileUpsertPayload } from "@/lib/profile-keys";
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

export function ProfileSection({
  user,
  profile,
}: {
  user: User;
  profile: Record<string, unknown> | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const existing = profile;

  const [firstName, setFirstName] = useState(String(existing?.first_name ?? ""));
  const [middleName, setMiddleName] = useState(String(existing?.middle_name ?? ""));
  const [lastName, setLastName] = useState(String(existing?.last_name ?? ""));
  const [fullName, setFullName] = useState(String(existing?.full_name ?? ""));
  const [phone, setPhone] = useState(String(existing?.phone ?? ""));
  const [contactEmail, setContactEmail] = useState(String(existing?.contact_email ?? ""));
  const [dob, setDob] = useState(
    existing?.date_of_birth ? String(existing.date_of_birth).slice(0, 10) : ""
  );
  const [avatarUrl, setAvatarUrl] = useState(String(existing?.avatar_url ?? ""));
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const onAvatarFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setMsg({ type: "err", text: "画像ファイルを選んでください。" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMsg({ type: "err", text: "5MB 以下の画像にしてください。" });
        return;
      }
      setAvatarUploading(true);
      setMsg(null);
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) {
        setAvatarUploading(false);
        setMsg({
          type: "err",
          text: upErr.message || "アップロードに失敗しました（バケット avatars・RLS を確認）。",
        });
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(pub.publicUrl);
      setAvatarUploading(false);
      setMsg({ type: "ok", text: "画像をアップロードしました。保存ボタンで確定できます。" });
    },
    [supabase, user.id]
  );

  const submitProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMsg(null);
      const values: Record<string, unknown> = {
        first_name: firstName.trim() || null,
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        full_name:
          fullName.trim() ||
          [firstName, middleName, lastName].filter(Boolean).join(" ").trim() ||
          null,
        phone: phone.trim() || null,
        contact_email: contactEmail.trim() || null,
        date_of_birth: dob || null,
        avatar_url: avatarUrl.trim() || null,
      };
      setLoading(true);
      if (existing) {
        const payload = buildProfileUpsertPayload(user.id, values, existing);
        const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
        setLoading(false);
        if (error) {
          setMsg({ type: "err", text: error.message || "プロフィールの保存に失敗しました。" });
          return;
        }
      } else {
        const payload = buildProfileInsertPayload(user.id, values);
        const { error } = await supabase.from("profiles").insert(payload);
        setLoading(false);
        if (error) {
          setMsg({
            type: "err",
            text: error.message || "プロフィールの作成に失敗しました。DB の列定義を確認してください。",
          });
          return;
        }
      }
      setMsg({ type: "ok", text: "プロフィールを保存しました。" });
    },
    [
      avatarUrl,
      contactEmail,
      dob,
      existing,
      firstName,
      fullName,
      lastName,
      middleName,
      phone,
      supabase,
      user.id,
    ]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-heading-ja text-2xl font-semibold" style={{ color: "var(--dashboard-text)" }}>
          個人情報
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
          氏名・連絡先・アバターを編集します。
        </p>
      </div>

      <section className={cardClass} style={cardStyle}>
        <SectionTitle>プロフィール</SectionTitle>
        <form onSubmit={submitProfile} className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border"
              style={{ borderColor: "var(--dashboard-border)" }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <MediaImage width={32} height={32} style={{ color: "var(--dashboard-text-muted)" }} />
              )}
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                アバター画像
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarFile}
                disabled={avatarUploading}
                className="mt-1 block text-sm"
                style={{ color: "var(--dashboard-text-muted)" }}
              />
              {avatarUploading ? <p className="text-xs text-green-600">アップロード中…</p> : null}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} style={labelStyle}>
                名（First）
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                ミドル（Middle）
              </label>
              <input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                姓（Last）
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
          {(!existing || "full_name" in existing) && (
            <div>
              <label className={labelClass} style={labelStyle}>
                表示名（full_name）
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="空欄の場合は名・姓から自動"
              />
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} style={labelStyle}>
                電話
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                生年月日
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>
              連絡用メール（contact_email）
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>
          {msg ? (
            <p className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
              {msg.text}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "保存中…" : "プロフィールを保存"}
          </button>
        </form>
      </section>
    </div>
  );
}
