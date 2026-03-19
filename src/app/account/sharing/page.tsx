import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SharingSection } from "@/components/SharingSection";

export default async function SharingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: affData, error: affError } = await supabase
    .from("profile_affiliations")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  const affiliationsAvailable = !affError;
  const affiliations = affiliationsAvailable && affData ? affData : [];

  return (
    <SharingSection
      user={user}
      profile={profile}
      affiliations={affiliations}
      affiliationsAvailable={affiliationsAvailable}
    />
  );
}
