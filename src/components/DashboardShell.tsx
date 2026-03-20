import type { User } from "@supabase/supabase-js";
import { AccountShell } from "@/components/AccountShell";

const LATLAS_URL = process.env.NEXT_PUBLIC_LATLAS_DASHBOARD_URL;

export function DashboardShell({
  user,
  avatarUrl,
  children,
}: {
  user: User;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  return (
    <AccountShell user={user} latlasUrl={LATLAS_URL} avatarUrl={avatarUrl}>
      {children}
    </AccountShell>
  );
}
