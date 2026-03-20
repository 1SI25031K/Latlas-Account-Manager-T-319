"use client";

import { useLayoutEffect } from "react";

/**
 * OS のカラースキームに合わせて html[data-theme] を維持する。
 * インライン script で先に付与しても、React ハイドレーションで消える可能性があるため
 * useLayoutEffect で再同期する。
 */
export function AccountThemeRoot() {
  useLayoutEffect(() => {
    function systemTheme() {
      try {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } catch {
        return "light";
      }
    }
    function apply() {
      document.documentElement.setAttribute("data-theme", systemTheme());
    }
    apply();
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, []);

  return null;
}
