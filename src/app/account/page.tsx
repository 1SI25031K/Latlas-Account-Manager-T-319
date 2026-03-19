import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Lock, ShareAndroid, UserCircle } from "iconoir-react";
import { AccountHomeHero } from "@/components/AccountHomeHero";

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
      <AccountHomeHero
        displayName={displayName}
        avatarUrl={profile?.avatar_url ? String(profile.avatar_url) : null}
        email={user.email ?? ""}
      />

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
