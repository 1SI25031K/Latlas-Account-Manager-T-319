import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SecuritySection } from "@/components/SecuritySection";

export default async function SecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <SecuritySection user={user} />;
}
