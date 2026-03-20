"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";

/**
 * アカウント各ページで、ホームと同様の「下からフェードイン」アニメーションを付与する。
 * 直接子要素ごとに段階的な遅延（最大8ブロック）を適用する。
 */
export function AccountPageReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [animated, setAnimated] = useState(false);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      queueMicrotask(() => setAnimated(true));
      return;
    }
    setAnimated(true);
  }, []);

  return (
    <div
      className={className ? `account-page-reveal ${className}` : "account-page-reveal"}
      data-animated={animated ? "true" : "false"}
      suppressHydrationWarning
    >
      {children}
    </div>
  );
}
