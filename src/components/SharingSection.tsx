"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useMemo, useState } from "react";
import { Plus, Trash } from "iconoir-react";
import { createClient } from "@/lib/supabase/client";
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

export function SharingSection({
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

  const existing = profile;
  const [emailVisible, setEmailVisible] = useState(Boolean(existing?.email_visible_to_students));
  const [shareAvatar, setShareAvatar] = useState(Boolean(existing?.share_avatar_with_students));
  const [studentContactJson, setStudentContactJson] = useState(() =>
    formatStudentContactJson(existing?.student_contact_json)
  );
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

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

  const submitSharingProfile = useCallback(
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
      setProfileLoading(true);
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email_visible_to_students: emailVisible,
          share_avatar_with_students: shareAvatar,
          student_contact_json: parsedContact,
        },
        { onConflict: "id" }
      );
      setProfileLoading(false);
      if (error) {
        setProfileMsg({
          type: "err",
          text: error.message || "設定の保存に失敗しました。",
        });
        return;
      }
      setProfileMsg({ type: "ok", text: "公開設定を保存しました。" });
    },
    [emailVisible, shareAvatar, studentContactJson, supabase, user.id]
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
          情報共有と連絡先
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
          生徒向けの公開設定・所属・連絡先を編集します。
        </p>
      </div>

      <section className={cardClass} style={cardStyle}>
        <SectionTitle>公開設定</SectionTitle>
        <form onSubmit={submitSharingProfile} className="space-y-4">
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
            {profileLoading ? "保存中…" : "公開設定を保存"}
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
