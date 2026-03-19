import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/AccountForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("profiles fetch error");
  }

  const { data: affData, error: affError } = await supabase
    .from("profile_affiliations")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  const affiliationsAvailable = !affError;
  const affiliations = affiliationsAvailable && affData ? affData : [];

  return (
    <AccountForm
      user={user}
      profile={profileError ? null : profile}
      affiliations={affiliations}
      affiliationsAvailable={affiliationsAvailable}
    />
  );
}
