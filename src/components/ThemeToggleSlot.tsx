"use client";

import dynamic from "next/dynamic";

const ThemeToggle = dynamic(
  () => import("@/components/ThemeToggle").then((m) => ({ default: m.ThemeToggle })),
  { ssr: false, loading: () => <span className="inline-block h-9 w-9 shrink-0" aria-hidden /> }
);

export function ThemeToggleSlot() {
  return <ThemeToggle />;
}
