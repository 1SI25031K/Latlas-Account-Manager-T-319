import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { NavArrowLeft } from "iconoir-react";
import { SignOutButton } from "@/components/SignOutButton";
import { SidebarNav } from "@/components/SidebarNav";
import { ThemeToggleSlot } from "@/components/ThemeToggleSlot";

const LATLAS_URL = process.env.NEXT_PUBLIC_LATLAS_DASHBOARD_URL;

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full">
      <aside
        className="flex w-56 shrink-0 flex-col border-r md:w-64"
        style={{
          backgroundColor: "var(--dashboard-sidebar)",
          borderColor: "var(--dashboard-border)",
        }}
      >
        <div className="flex h-14 items-center border-b px-4" style={{ borderColor: "var(--dashboard-border)" }}>
          <span className="font-heading-ja text-sm font-semibold" style={{ color: "var(--dashboard-text)" }}>
            Latlas Account
          </span>
        </div>
        <SidebarNav />
        <div className="border-t p-2" style={{ borderColor: "var(--dashboard-border)" }}>
          {LATLAS_URL ? (
            <Link
              href={LATLAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:opacity-90"
              style={{ color: "var(--dashboard-text-muted)" }}
            >
              <NavArrowLeft width={18} height={18} strokeWidth={1.5} />
              Latlas ダッシュボードに戻る
            </Link>
          ) : null}
          <div className="flex items-center gap-2 px-3 py-1 text-xs" style={{ color: "var(--dashboard-text-muted)" }}>
            <span className="truncate" title={user.email ?? ""}>
              {user.email}
            </span>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 items-center justify-end border-b px-4 md:px-6"
          style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-bg)",
          }}
        >
          <ThemeToggleSlot />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8" style={{ backgroundColor: "var(--dashboard-bg)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
