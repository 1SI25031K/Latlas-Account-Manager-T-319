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
} from "iconoir-react";
import type { ReactNode } from "react";

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

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-2">
      {NAV_ITEMS.map(({ href, label, icon, iconBgColor }) => {
        const isActive =
          href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
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
  );
}
