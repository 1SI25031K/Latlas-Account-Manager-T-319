"use client";

import { useCallback, useState } from "react";
import { HalfMoon, SunLight } from "iconoir-react";

const STORAGE_KEY = "dashboard-theme";

function readTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const t = document.documentElement.getAttribute("data-theme");
  return t === "dark" || t === "light" ? t : "light";
}

function applyTheme(mode: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add("dashboard-theme-root");
  document.documentElement.setAttribute("data-theme", mode);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">(readTheme);

  const toggle = useCallback(() => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    applyTheme(next);
  }, [mode]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
      style={{
        borderColor: "var(--dashboard-border)",
        backgroundColor: "var(--dashboard-card)",
        color: "var(--dashboard-text-muted)",
      }}
      title={mode === "light" ? "ダークモード" : "ライトモード"}
      aria-label={mode === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え"}
    >
      {mode === "light" ? <HalfMoon width={20} height={20} /> : <SunLight width={20} height={20} />}
    </button>
  );
}
