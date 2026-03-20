import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AccountHomeAI } from "@/components/account-ai/AccountHomeAI";

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

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AccountHomeAI
        displayName={displayName}
        avatarUrl={profile?.avatar_url ? String(profile.avatar_url) : null}
        email={user.email ?? ""}
      />
    </div>
  );
}
