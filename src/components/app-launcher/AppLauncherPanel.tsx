"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import type { LauncherConfigV1 } from "@/lib/app-launcher";
import { AppLauncherGrid } from "@/components/app-launcher/AppLauncherGrid";

/**
 * マウントごとに二重 rAF 後に visible（360ms ease-out は親の style で指定）
 */
export function AppLauncherPanel({
  panelRef,
  panelStyle,
  config,
  onEditShortcuts,
}: {
  panelRef: RefObject<HTMLDivElement | null>;
  panelStyle: { top: number; right: number };
  config: LauncherConfigV1;
  onEditShortcuts: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div
      ref={panelRef}
      id="account-app-launcher-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Apps"
      className="app-launcher-panel fixed z-[200] overflow-x-hidden rounded-2xl border p-5 shadow-lg"
      style={{
        top: panelStyle.top,
        right: panelStyle.right,
        width: "min(440px, calc(100vw - 12px))",
        maxWidth: "calc(100vw - 12px)",
        backgroundColor: "var(--dashboard-card)",
        borderColor: "var(--dashboard-border)",
        maxHeight: "min(72vh, 560px)",
        overflowY: "auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 360ms ease-out, transform 360ms ease-out",
      }}
    >
      <AppLauncherGrid items={config.items} />
      <button
        type="button"
        className="mt-3 w-full rounded-2xl border py-2.5 text-xs font-medium transition-opacity hover:opacity-90"
        style={{
          borderColor: "var(--dashboard-border)",
          color: "var(--dashboard-text)",
        }}
        onClick={onEditShortcuts}
      >
        ショートカットを編集
      </button>
    </div>
  );
}
