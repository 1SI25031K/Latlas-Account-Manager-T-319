"use client";

import { useSyncExternalStore } from "react";
import {
  LAUNCHER_STORAGE_KEY,
  readLauncherConfig,
  SERVER_LAUNCHER_CONFIG_SNAPSHOT,
  type LauncherConfigV1,
} from "@/lib/app-launcher";

/** getSnapshot が同一データで毎回新オブジェクトを返さないよう JSON シグネチャでキャッシュ */
let clientSnapshotCache: { sig: string; snapshot: LauncherConfigV1 } | null = null;

function subscribe(onStoreChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === LAUNCHER_STORAGE_KEY || e.key === null) {
      clientSnapshotCache = null;
      onStoreChange();
    }
  };
  const onCustom = () => {
    clientSnapshotCache = null;
    onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("latlas-app-launcher-changed", onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("latlas-app-launcher-changed", onCustom);
  };
}

function getSnapshot(): LauncherConfigV1 {
  const fresh = readLauncherConfig();
  const sig = JSON.stringify(fresh);
  if (clientSnapshotCache && clientSnapshotCache.sig === sig) {
    return clientSnapshotCache.snapshot;
  }
  clientSnapshotCache = { sig, snapshot: fresh };
  return fresh;
}

function getServerSnapshot(): LauncherConfigV1 {
  return SERVER_LAUNCHER_CONFIG_SNAPSHOT;
}

/** localStorage + 同一タブ内の保存と購読で Dashboard と同期 */
export function useLauncherConfigSnapshot(): LauncherConfigV1 {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
