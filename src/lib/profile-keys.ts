/** Latlas profiles で想定される列（存在しない列は読み取り／更新から除外） */
export const PROFILE_WRITABLE_KEYS = [
  "full_name",
  "first_name",
  "middle_name",
  "last_name",
  "avatar_url",
  "phone",
  "contact_email",
  "email_visible_to_students",
  "date_of_birth",
  "share_avatar_with_students",
  "student_contact_json",
] as const;

export type ProfileWritableKey = (typeof PROFILE_WRITABLE_KEYS)[number];

export function buildProfileUpsertPayload(
  userId: string,
  values: Record<string, unknown>,
  existingRow: Record<string, unknown> | null
): Record<string, unknown> {
  const payload: Record<string, unknown> = { id: userId };
  for (const key of PROFILE_WRITABLE_KEYS) {
    if (!(key in values)) continue;
    if (existingRow != null && !Object.prototype.hasOwnProperty.call(existingRow, key)) {
      continue;
    }
    payload[key] = values[key];
  }
  return payload;
}

/** 新規プロフィール行: よくある列のみ送る（失敗時はユーザーにメッセージ） */
export function buildProfileInsertPayload(
  userId: string,
  values: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = { id: userId };
  for (const key of PROFILE_WRITABLE_KEYS) {
    if (key in values) payload[key] = values[key];
  }
  return payload;
}
