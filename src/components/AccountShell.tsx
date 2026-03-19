"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UserCircle,
  Lock,
  Shield,
  ShareAndroid,
  CloudUpload,
  NavArrowLeft,
} from "iconoir-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggleSlot } from "@/components/ThemeToggleSlot";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: ReactNode;
  iconBgColor: string;
}[] = [
  {
    href: "/account",
    label: "ホーム",
    icon: <Home width={20} height={20} strokeWidth={1.5} className="text-white" />,
    iconBgColor: "#4285f4",
  },
  {
    href: "/account/profile",
    label: "個人情報",
    icon: <UserCircle width={20} height={20} strokeWidth={1.5} className="text-white" />,
    iconBgColor: "#34a853",
  },
  {
    href: "/account/security",
    label: "セキュリティとログイン",
    icon: <Lock width={20} height={20} strokeWidth={1.5} className="text-white" />,
    iconBgColor: "#4285f4",
  },
  {
    href: "/account/data-privacy",
    label: "データとプライバシー",
    icon: <Shield width={20} height={20} strokeWidth={1.5} className="text-white" />,
    iconBgColor: "#9c27b0",
  },
  {
    href: "/account/sharing",
    label: "情報共有と連絡先",
    icon: <ShareAndroid width={20} height={20} strokeWidth={1.5} className="text-white" />,
    iconBgColor: "#f06292",
  },
  {
    href: "/account/storage",
    label: "ストレージ",
    icon: <CloudUpload width={20} height={20} strokeWidth={1.5} className="text-white" />,
    iconBgColor: "#ff9800",
  },
];

function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/account" ? pathname === "/account" : pathname.startsWith(href);
}

export function AccountShell({
  user,
  latlasUrl,
  children,
}: {
  user: User;
  latlasUrl: string | undefined;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7891/ingest/c7be69ac-68de-41af-8832-64fc1180a20c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a06a3d" },
      body: JSON.stringify({
        sessionId: "a06a3d",
        location: "AccountShell.tsx:useEffect",
        message: "commit snapshot",
        data: { pathname, pending },
        timestamp: Date.now(),
        hypothesisId: "I1",
        runId: "post-fix",
      }),
    }).catch(() => {});
  }, [pathname, pending]);
  // #endregion

  return (
    <div className="flex min-h-full flex-col">
      {/* 全幅トップバー: タイトル + テーマ。インジケーターは高さを変えず bottom に absolute */}
      <div
        className="relative z-10 flex w-full shrink-0"
        style={{ borderColor: "var(--dashboard-border)" }}
      >
        <div
          className="flex h-14 w-56 shrink-0 items-center border-b border-r px-4 md:w-64"
          style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-sidebar)",
          }}
        >
          <span className="font-heading-ja text-sm font-semibold" style={{ color: "var(--dashboard-text)" }}>
            Latlas Account
          </span>
        </div>
        <header
          className="flex h-14 min-w-0 flex-1 items-center justify-end border-b px-4 md:px-6"
          style={{
            borderColor: "var(--dashboard-border)",
            backgroundColor: "var(--dashboard-bg)",
          }}
        >
          <ThemeToggleSlot />
        </header>
        <div
          className={`dashboard-nav-progress-track pointer-events-none ${pending ? "dashboard-nav-progress-track--active" : "dashboard-nav-progress-track--idle"}`}
          role={pending ? "progressbar" : undefined}
          aria-busy={pending ? true : undefined}
          aria-label={pending ? "ページを読み込み中" : undefined}
          aria-valuetext={pending ? "読み込み中" : undefined}
        >
          {pending ? <div className="dashboard-nav-progress-segment" aria-hidden /> : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          className="flex w-56 shrink-0 flex-col border-r md:w-64"
          style={{
            backgroundColor: "var(--dashboard-sidebar)",
            borderColor: "var(--dashboard-border)",
          }}
        >
          <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
            {NAV_ITEMS.map(({ href, label, icon, iconBgColor }) => {
              const isActive = isNavItemActive(href, pathname);
              return (
                <Link
                  key={href}
                  href={href}
              onClick={() => {
                if (!isActive) {
                  // #region agent log
                  fetch("http://127.0.0.1:7891/ingest/c7be69ac-68de-41af-8832-64fc1180a20c", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a06a3d" },
                    body: JSON.stringify({
                      sessionId: "a06a3d",
                      location: "AccountShell.tsx:Link.onClick",
                      message: "nav click setPending true",
                      data: { href, pathname, isActive },
                      timestamp: Date.now(),
                      hypothesisId: "I2",
                      runId: "post-fix",
                    }),
                  }).catch(() => {});
                  // #endregion
                  setPending(true);
                }
              }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: isActive ? "var(--dashboard-nav-active-bg)" : "transparent",
                    color: "var(--dashboard-text)",
                  }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: iconBgColor }}
                  >
                    {icon}
                  </span>
                  <span className="font-heading-ja truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-2" style={{ borderColor: "var(--dashboard-border)" }}>
            {latlasUrl ? (
              <Link
                href={latlasUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:opacity-90"
                style={{ color: "var(--dashboard-text-muted)" }}
              >
                <NavArrowLeft width={18} height={18} strokeWidth={1.5} />
                Latlas ダッシュボードに戻る
              </Link>
            ) : null}
            <div
              className="flex items-center gap-2 px-3 py-1 text-xs"
              style={{ color: "var(--dashboard-text-muted)" }}
            >
              <span className="truncate" title={user.email ?? ""}>
                {user.email}
              </span>
            </div>
            <SignOutButton />
          </div>
        </aside>
        <main className="min-h-0 flex-1 overflow-auto p-4 md:p-8" style={{ backgroundColor: "var(--dashboard-bg)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
