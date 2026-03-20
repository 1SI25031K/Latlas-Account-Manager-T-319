"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash } from "iconoir-react";
import type { LauncherItemV1 } from "@/lib/app-launcher";
import { readLauncherConfig, writeLauncherConfig } from "@/lib/app-launcher";

function newId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 親が `editorOpen` でマウント制御し、`key` で開くたびに状態をリセットする */
export function AppLauncherEditorModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: () => void;
}) {
  const titleId = useId();
  const [items, setItems] = useState<LauncherItemV1[]>(() => readLauncherConfig().items);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const save = () => {
    writeLauncherConfig({ version: 1, items });
    onSaved?.();
    onClose();
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(85vh,640px)] w-full max-w-md flex-col rounded-2xl border p-5 shadow-lg"
        style={{
          backgroundColor: "var(--dashboard-card)",
          borderColor: "var(--dashboard-border)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-sm font-semibold" style={{ color: "var(--dashboard-text)" }}>
          ショートカットを編集
        </h2>
        <p className="mt-1 text-xs" style={{ color: "var(--dashboard-text-muted)" }}>
          変更はこのブラウザに保存され、Latlas Dashboard と同じキー（latlas-app-launcher-v1）で共有されます。
        </p>

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
          {items.map((row, index) => (
            <div
              key={row.id}
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--dashboard-border)" }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium" style={{ color: "var(--dashboard-text-muted)" }}>
                  #{index + 1}
                </span>
                <button
                  type="button"
                  className="rounded-lg p-1.5 transition-opacity hover:opacity-90"
                  style={{ color: "var(--dashboard-text-muted)" }}
                  aria-label="このショートカットを削除"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash width={18} height={18} strokeWidth={1.5} />
                </button>
              </div>
              <label className="block">
                <span className="text-xs" style={{ color: "var(--dashboard-text-muted)" }}>
                  タイトル
                </span>
                <input
                  className="mt-0.5 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-bg)",
                    color: "var(--dashboard-text)",
                  }}
                  value={row.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, title: v } : it)));
                  }}
                />
              </label>
              <label className="mt-2 block">
                <span className="text-xs" style={{ color: "var(--dashboard-text-muted)" }}>
                  URL
                </span>
                <input
                  className="mt-0.5 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-bg)",
                    color: "var(--dashboard-text)",
                  }}
                  value={row.href}
                  onChange={(e) => {
                    const v = e.target.value;
                    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, href: v } : it)));
                  }}
                />
              </label>
              <label className="mt-2 block">
                <span className="text-xs" style={{ color: "var(--dashboard-text-muted)" }}>
                  アイコン（home / user / settings / calendar / folder / link）
                </span>
                <input
                  className="mt-0.5 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: "var(--dashboard-border)",
                    backgroundColor: "var(--dashboard-bg)",
                    color: "var(--dashboard-text)",
                  }}
                  value={row.icon ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    setItems((prev) =>
                      prev.map((it, i) => (i === index ? { ...it, icon: v || undefined } : it)),
                    );
                  }}
                />
              </label>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-medium transition-opacity hover:opacity-90"
          style={{
            borderColor: "var(--dashboard-border)",
            color: "var(--dashboard-text)",
          }}
          onClick={() =>
            setItems((prev) => [...prev, { id: newId(), title: "新しいショートカット", href: "/", icon: "link" }])
          }
        >
          <Plus width={18} height={18} strokeWidth={1.5} />
          追加
        </button>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-2xl border py-2.5 text-xs font-medium transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--dashboard-border)",
              color: "var(--dashboard-text-muted)",
            }}
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="flex-1 rounded-2xl border py-2.5 text-xs font-medium transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--dashboard-border)",
              backgroundColor: "var(--dashboard-nav-active-bg)",
              color: "var(--dashboard-text)",
            }}
            onClick={save}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
