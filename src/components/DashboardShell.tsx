import type { User } from "@supabase/supabase-js";
import { AccountShell } from "@/components/AccountShell";

const LATLAS_URL = process.env.NEXT_PUBLIC_LATLAS_DASHBOARD_URL;

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <AccountShell user={user} latlasUrl={LATLAS_URL}>
      {children}
    </AccountShell>
  );
}
