"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppLauncherEditorModal } from "@/components/app-launcher/AppLauncherEditorModal";
import { AppLauncherPanel } from "@/components/app-launcher/AppLauncherPanel";
import { useLauncherConfigSnapshot } from "@/components/app-launcher/useLauncherConfigSnapshot";

/** 3×3 の丸ドット（仕様どおり grid + gap-[2px] + rounded-full bg-current） */
function NineDotGrid() {
  return (
    <span className="grid h-5 w-5 grid-cols-3 gap-[2px]" aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-current" />
      ))}
    </span>
  );
}

export function AppLauncher() {
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [panelKey, setPanelKey] = useState(0);
  const config = useLauncherConfigSnapshot();
  const [panelStyle, setPanelStyle] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanelStyle({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => updatePosition();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const panel =
    open &&
    createPortal(
      <AppLauncherPanel
        key={panelKey}
        panelRef={panelRef}
        panelStyle={panelStyle}
        config={config}
        onEditShortcuts={() => {
          setEditorKey((k) => k + 1);
          setEditorOpen(true);
        }}
      />,
      document.body,
    );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-opacity hover:opacity-90"
        style={{ color: open ? "var(--dashboard-text)" : "var(--dashboard-text-muted)" }}
        aria-label="Apps"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="account-app-launcher-panel"
        aria-pressed={open}
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) setPanelKey((k) => k + 1);
            return next;
          });
        }}
      >
        <NineDotGrid />
      </button>
      {panel}
      {editorOpen ? (
        <AppLauncherEditorModal
          key={editorKey}
          onClose={() => setEditorOpen(false)}
        />
      ) : null}
    </>
  );
}
