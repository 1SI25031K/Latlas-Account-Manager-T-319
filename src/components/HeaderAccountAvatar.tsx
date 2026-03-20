import { User } from "iconoir-react";

/**
 * Dashboard 右上アバターと同見た目。クリックではメニューを開かない（装飾のみ）。
 */
export function HeaderAccountAvatar({ avatarUrl }: { avatarUrl: string | null }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 cursor-default select-none items-center justify-center overflow-hidden rounded-full border transition-opacity hover:opacity-90"
      style={{
        backgroundColor: "var(--dashboard-bg)",
        borderColor: "var(--dashboard-border)",
      }}
      role="img"
      aria-label="Account"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase 公開 URL
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <User width={20} height={20} strokeWidth={1.5} style={{ color: "var(--dashboard-text-muted)" }} />
      )}
    </div>
  );
}
