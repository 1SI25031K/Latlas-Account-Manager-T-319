import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserCircle, Lock, ShareAndroid } from "iconoir-react";

export default async function AccountHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    (profile?.full_name as string)?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    user.email?.split("@")[0] ||
    "ユーザー";

  const quickLinks = [
    { href: "/account/profile", label: "個人情報", icon: UserCircle },
    { href: "/account/security", label: "パスワード", icon: Lock },
    { href: "/account/sharing", label: "情報共有", icon: ShareAndroid },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center text-center">
        <div
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2"
          style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-card)",
          }}
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(profile.avatar_url)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircle
              width={48}
              height={48}
              style={{ color: "var(--dashboard-text-muted)" }}
            />
          )}
        </div>
        <h1
          className="font-heading-ja mt-4 text-2xl font-semibold"
          style={{ color: "var(--dashboard-text)" }}
        >
          {displayName}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--dashboard-text-muted)" }}>
          {user.email}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {quickLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors hover:opacity-90"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-card)",
              color: "var(--dashboard-text)",
            }}
          >
            <Icon width={18} height={18} strokeWidth={1.5} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
