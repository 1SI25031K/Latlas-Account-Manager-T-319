"use client";

import { UserCircle } from "iconoir-react";
import { useEffect, useLayoutEffect, useState } from "react";

export function AccountHomeHero({
  displayName,
  avatarUrl,
  email,
}: {
  displayName: string;
  avatarUrl: string | null;
  email: string;
}) {
  const [animated, setAnimated] = useState(false);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // #region agent log
    fetch("http://127.0.0.1:7891/ingest/c7be69ac-68de-41af-8832-64fc1180a20c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a06a3d" },
      body: JSON.stringify({
        sessionId: "a06a3d",
        location: "AccountHomeHero.tsx:useLayoutEffect",
        message: "layout start",
        data: { reduced },
        timestamp: Date.now(),
        hypothesisId: "A3",
        runId: "post-fix",
      }),
    }).catch(() => {});
    // #endregion
    if (reduced) {
      queueMicrotask(() => setAnimated(true));
      return;
    }
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setAnimated(true);
        // #region agent log
        fetch("http://127.0.0.1:7891/ingest/c7be69ac-68de-41af-8832-64fc1180a20c", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a06a3d" },
          body: JSON.stringify({
            sessionId: "a06a3d",
            location: "AccountHomeHero.tsx:raf2",
            message: "setAnimated true",
            data: {},
            timestamp: Date.now(),
            hypothesisId: "A1",
            runId: "post-fix",
          }),
        }).catch(() => {});
        // #endregion
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7891/ingest/c7be69ac-68de-41af-8832-64fc1180a20c", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a06a3d" },
      body: JSON.stringify({
        sessionId: "a06a3d",
        location: "AccountHomeHero.tsx:useEffect",
        message: "after paint animated state",
        data: { animated },
        timestamp: Date.now(),
        hypothesisId: "A1",
        runId: "post-fix",
      }),
    }).catch(() => {});
  }, [animated]);
  // #endregion

  return (
    <div
      className="account-home-hero flex flex-col items-center text-center"
      data-animated={animated ? "true" : "false"}
      suppressHydrationWarning
    >
      <div
        className="account-home-item-1 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2"
        style={{
          borderColor: "var(--dashboard-border)",
          backgroundColor: "var(--dashboard-card)",
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserCircle width={48} height={48} style={{ color: "var(--dashboard-text-muted)" }} />
        )}
      </div>
      <h1
        className="account-home-item-2 font-heading-ja mt-4 text-2xl font-semibold"
        style={{ color: "var(--dashboard-text)" }}
      >
        {displayName}
      </h1>
      <p
        className="account-home-item-3 mt-1 text-sm"
        style={{ color: "var(--dashboard-text-muted)" }}
      >
        {email}
      </p>
    </div>
  );
}
