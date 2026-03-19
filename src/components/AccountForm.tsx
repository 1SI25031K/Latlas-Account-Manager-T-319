"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useMemo, useState } from "react";
import { Plus, Trash, MediaImage } from "iconoir-react";
import { createClient } from "@/lib/supabase/client";
import { buildProfileInsertPayload, buildProfileUpsertPayload } from "@/lib/profile-keys";
import { SectionTitle } from "@/components/SectionTitle";

type AffiliationRow = {
  id?: string;
  affiliation: string;
  title_at_affiliation: string;
};

function formatStudentContactJson(raw: unknown): string {
  if (raw == null || raw === "") return "{\n  \n}";
  if (typeof raw === "string") {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return String(raw);
    }
  }
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return "{}";
  }
}

export function AccountForm({
  user,
  profile,
  affiliations: initialAffiliations,
  affiliationsAvailable,
}: {
  user: User;
  profile: Record<string, unknown> | null;
  affiliations: Record<string, unknown>[];
  affiliationsAvailable: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);

  const email = user.email ?? "";
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

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
  const [emailVisible, setEmailVisible] = useState(Boolean(existing?.email_visible_to_students));
  const [shareAvatar, setShareAvatar] = useState(Boolean(existing?.share_avatar_with_students));
  const [studentContactJson, setStudentContactJson] = useState(() =>
    formatStudentContactJson(existing?.student_contact_json)
  );
  const [avatarUrl, setAvatarUrl] = useState(String(existing?.avatar_url ?? ""));
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [affRows, setAffRows] = useState<AffiliationRow[]>(() => {
    if (!initialAffiliations?.length) return [{ affiliation: "", title_at_affiliation: "" }];
    return initialAffiliations.map((r) => ({
      id: typeof r.id === "string" ? r.id : undefined,
      affiliation: String(r.affiliation ?? ""),
      title_at_affiliation: String(r.title_at_affiliation ?? ""),
    }));
  });
  const [affMsg, setAffMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [affLoading, setAffLoading] = useState(false);

  const cardClass =
    "rounded-2xl border p-6 shadow-sm";
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

  const submitProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setProfileMsg(null);
      let parsedContact: unknown = null;
      const t = studentContactJson.trim();
      if (t) {
        try {
          parsedContact = JSON.parse(t);
        } catch {
          setProfileMsg({ type: "err", text: "生徒向け連絡（JSON）の形式が正しくありません。" });
          return;
        }
      }

      const values: Record<string, unknown> = {};
      if (!existing || "first_name" in existing) values.first_name = firstName.trim() || null;
      if (!existing || "middle_name" in existing) values.middle_name = middleName.trim() || null;
      if (!existing || "last_name" in existing) values.last_name = lastName.trim() || null;
      if (!existing || "full_name" in existing)
        values.full_name =
          fullName.trim() ||
          [firstName, middleName, lastName].filter(Boolean).join(" ").trim() ||
          null;
      if (!existing || "phone" in existing) values.phone = phone.trim() || null;
      if (!existing || "contact_email" in existing) values.contact_email = contactEmail.trim() || null;
      if (!existing || "date_of_birth" in existing) values.date_of_birth = dob || null;
      if (!existing || "email_visible_to_students" in existing)
        values.email_visible_to_students = emailVisible;
      if (!existing || "share_avatar_with_students" in existing)
        values.share_avatar_with_students = shareAvatar;
      if (!existing || "student_contact_json" in existing)
        values.student_contact_json = parsedContact;
      if (!existing || "avatar_url" in existing) values.avatar_url = avatarUrl.trim() || null;

      setProfileLoading(true);
      if (existing) {
        const payload = buildProfileUpsertPayload(user.id, values, existing);
        const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
        setProfileLoading(false);
        if (error) {
          setProfileMsg({
            type: "err",
            text: error.message || "プロフィールの保存に失敗しました。",
          });
          return;
        }
      } else {
        const payload = buildProfileInsertPayload(user.id, values);
        const { error } = await supabase.from("profiles").insert(payload);
        setProfileLoading(false);
        if (error) {
          setProfileMsg({
            type: "err",
            text:
              error.message ||
              "プロフィールの作成に失敗しました。DB の列定義を確認してください。",
          });
          return;
        }
      }
      setProfileMsg({ type: "ok", text: "プロフィールを保存しました。" });
    },
    [
      avatarUrl,
      contactEmail,
      dob,
      emailVisible,
      existing,
      firstName,
      fullName,
      lastName,
      middleName,
      phone,
      shareAvatar,
      studentContactJson,
      supabase,
      user.id,
    ]
  );

  const onAvatarFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setProfileMsg({ type: "err", text: "画像ファイルを選んでください。" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setProfileMsg({ type: "err", text: "5MB 以下の画像にしてください。" });
        return;
      }
      setAvatarUploading(true);
      setProfileMsg(null);
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) {
        setAvatarUploading(false);
        setProfileMsg({
          type: "err",
          text: upErr.message || "アップロードに失敗しました（バケット avatars・RLS を確認）。",
        });
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(pub.publicUrl);
      setAvatarUploading(false);
      setProfileMsg({ type: "ok", text: "画像をアップロードしました。プロフィール保存で確定できます。" });
    },
    [supabase, user.id]
  );

  const saveAffiliations = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!affiliationsAvailable) return;
      setAffMsg(null);
      setAffLoading(true);
      const { data: current, error: fetchErr } = await supabase
        .from("profile_affiliations")
        .select("id")
        .eq("user_id", user.id);
      if (fetchErr) {
        setAffLoading(false);
        setAffMsg({ type: "err", text: fetchErr.message || "読み込みに失敗しました。" });
        return;
      }
      const keepIds = new Set(affRows.filter((r) => r.id).map((r) => r.id as string));
      for (const row of current || []) {
        const id = row.id as string;
        if (!keepIds.has(id)) {
          await supabase.from("profile_affiliations").delete().eq("id", id).eq("user_id", user.id);
        }
      }
      for (let i = 0; i < affRows.length; i++) {
        const r = affRows[i];
        if (r.id) {
          const { error } = await supabase
            .from("profile_affiliations")
            .update({
              affiliation: r.affiliation.trim(),
              title_at_affiliation: r.title_at_affiliation.trim(),
              sort_order: i,
            })
            .eq("id", r.id)
            .eq("user_id", user.id);
          if (error) {
            setAffLoading(false);
            setAffMsg({ type: "err", text: error.message || "保存に失敗しました。" });
            return;
          }
        } else if (r.affiliation.trim() || r.title_at_affiliation.trim()) {
          const { error } = await supabase.from("profile_affiliations").insert({
            user_id: user.id,
            affiliation: r.affiliation.trim(),
            title_at_affiliation: r.title_at_affiliation.trim(),
            sort_order: i,
          });
          if (error) {
            setAffLoading(false);
            setAffMsg({ type: "err", text: error.message || "保存に失敗しました。" });
            return;
          }
        }
      }
      setAffLoading(false);
      setAffMsg({ type: "ok", text: "所属を保存しました。ページを再読み込みすると ID が反映されます。" });
    },
    [affRows, affiliationsAvailable, supabase, user.id]
  );

  const addAffRow = () =>
    setAffRows((rows) => [...rows, { affiliation: "", title_at_affiliation: "" }]);
  const removeAffRow = (index: number) =>
    setAffRows((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-heading-ja text-2xl font-semibold" style={{ color: "var(--dashboard-text)" }}>
          アカウント設定
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
          ログイン情報とプロフィールは Latlas と同じデータベースに保存されます。
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
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--dashboard-text)" }}>
              <input
                type="checkbox"
                checked={emailVisible}
                onChange={(e) => setEmailVisible(e.target.checked)}
                className="rounded border-gray-300"
              />
              生徒にメールを公開する
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--dashboard-text)" }}>
              <input
                type="checkbox"
                checked={shareAvatar}
                onChange={(e) => setShareAvatar(e.target.checked)}
                className="rounded border-gray-300"
              />
              アバターを生徒と共有する
            </label>
          </div>
          {(!existing || "student_contact_json" in existing) && (
            <div>
              <label className={labelClass} style={labelStyle}>
                生徒向け連絡（JSON）
              </label>
              <textarea
                value={studentContactJson}
                onChange={(e) => setStudentContactJson(e.target.value)}
                rows={6}
                className={`${inputClass} font-mono text-xs`}
                style={inputStyle}
                spellCheck={false}
              />
            </div>
          )}
          {profileMsg ? (
            <p className={`text-sm ${profileMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
              {profileMsg.text}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={profileLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {profileLoading ? "保存中…" : "プロフィールを保存"}
          </button>
        </form>
      </section>

      {affiliationsAvailable ? (
        <section className={cardClass} style={cardStyle}>
          <SectionTitle>所属・肩書</SectionTitle>
          <p className="mb-4 text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
            複数行で登録できます。空行は保存時に無視されます。
          </p>
          <div className="space-y-3">
            {affRows.map((row, index) => (
              <div key={row.id ?? `new-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className={labelClass} style={labelStyle}>
                    所属
                  </label>
                  <input
                    value={row.affiliation}
                    onChange={(e) =>
                      setAffRows((rows) =>
                        rows.map((x, i) => (i === index ? { ...x, affiliation: e.target.value } : x))
                      )
                    }
                    className={inputClass}
                    style={inputStyle}
                    placeholder="例: ○○高等学校"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <label className={labelClass} style={labelStyle}>
                    肩書
                  </label>
                  <input
                    value={row.title_at_affiliation}
                    onChange={(e) =>
                      setAffRows((rows) =>
                        rows.map((x, i) =>
                          i === index ? { ...x, title_at_affiliation: e.target.value } : x
                        )
                      )
                    }
                    className={inputClass}
                    style={inputStyle}
                    placeholder="例: 教諭"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAffRow(index)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                  style={{ borderColor: "var(--dashboard-border)", color: "var(--dashboard-text-muted)" }}
                  aria-label="行を削除"
                >
                  <Trash width={18} height={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAffRow}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
            >
              <Plus width={18} height={18} />
              行を追加
            </button>
          </div>
          {affMsg ? (
            <p className={`mt-3 text-sm ${affMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
              {affMsg.text}
            </p>
          ) : null}
          <form onSubmit={saveAffiliations} className="mt-4">
            <button
              type="submit"
              disabled={affLoading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {affLoading ? "保存中…" : "所属を保存"}
            </button>
          </form>
        </section>
      ) : (
        <section className={cardClass} style={cardStyle}>
          <SectionTitle>所属・肩書</SectionTitle>
          <p className="text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
            profile_affiliations テーブルが利用できないか、読み込みに失敗しました。Latlas 側のスキーマを確認してください。
          </p>
        </section>
      )}
    </div>
  );
}
