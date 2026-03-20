/**
 * Latlas Dashboard の `readLauncherConfig` / `DEFAULT_LAUNCHER_ITEMS` と
 * localStorage キー `latlas-app-launcher-v1` を揃えるためのモジュール。
 *
 * Dashboard 側の `app-launcher.ts` と型・シリアル形式が一致していれば、
 * ショートカットは両アプリで同期されます。差分がある場合は Dashboard から
 * 本ファイルへコピーするか共有パッケージ化してください。
 */

export const LAUNCHER_STORAGE_KEY = "latlas-app-launcher-v1";

/** Dashboard のアイコンキーと揃えやすいよう string を許容 */
export type LauncherIconKey = string;

export type LauncherItemV1 = {
  id: string;
  title: string;
  href: string;
  icon?: LauncherIconKey;
};

export type LauncherConfigV1 = {
  version: 1;
  items: LauncherItemV1[];
};

function envDashboardBase(): string {
  if (typeof process === "undefined" || !process.env.NEXT_PUBLIC_LATLAS_DASHBOARD_URL) return "";
  return String(process.env.NEXT_PUBLIC_LATLAS_DASHBOARD_URL).trim().replace(/\/$/, "");
}

export function getDefaultLauncherItems(): LauncherItemV1[] {
  const dash = envDashboardBase();
  const items: LauncherItemV1[] = [];
  if (dash) {
    items.push({
      id: "latlas-dashboard",
      title: "Latlas Dashboard",
      href: dash,
      icon: "home",
    });
  }
  items.push({
    id: "latlas-account",
    title: "Latlas Account",
    href: "/account",
    icon: "user",
  });
  return items;
}

/**
 * `useSyncExternalStore` の getServerSnapshot は呼び出しごとに同一参照を返す必要がある。
 * （毎回 `{ version, items }` を新規生成すると React が無限ループ扱いする）
 */
export const SERVER_LAUNCHER_CONFIG_SNAPSHOT: LauncherConfigV1 = {
  version: 1,
  items: getDefaultLauncherItems(),
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeItem(raw: unknown): LauncherItemV1 | null {
  if (!isRecord(raw)) return null;
  const id = String(raw.id ?? "").trim();
  const title = String(raw.title ?? raw.label ?? "").trim();
  const href = String(raw.href ?? raw.url ?? "").trim();
  if (!id || !title || !href) return null;
  const icon = raw.icon != null ? String(raw.icon) : undefined;
  return { id, title, href, icon };
}

function parseStored(json: string): LauncherItemV1[] | null {
  try {
    const data = JSON.parse(json) as unknown;
    if (Array.isArray(data)) {
      const items = data.map(normalizeItem).filter(Boolean) as LauncherItemV1[];
      return items.length ? items : null;
    }
    if (isRecord(data)) {
      const rawItems = data.items;
      if (Array.isArray(rawItems)) {
        const items = rawItems.map(normalizeItem).filter(Boolean) as LauncherItemV1[];
        return items.length ? items : null;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function readLauncherConfig(): LauncherConfigV1 {
  if (typeof window === "undefined") {
    return SERVER_LAUNCHER_CONFIG_SNAPSHOT;
  }
  try {
    const raw = window.localStorage.getItem(LAUNCHER_STORAGE_KEY);
    if (!raw) return SERVER_LAUNCHER_CONFIG_SNAPSHOT;
    const items = parseStored(raw);
    if (!items?.length) return SERVER_LAUNCHER_CONFIG_SNAPSHOT;
    return { version: 1, items };
  } catch {
    return SERVER_LAUNCHER_CONFIG_SNAPSHOT;
  }
}

export function writeLauncherConfig(config: LauncherConfigV1): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAUNCHER_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event("latlas-app-launcher-changed"));
  } catch {
    /* quota / private mode */
  }
}

/** Dashboard 互換エイリアス（サーバースナップショットと同一配列参照） */
export const DEFAULT_LAUNCHER_ITEMS = SERVER_LAUNCHER_CONFIG_SNAPSHOT.items;
