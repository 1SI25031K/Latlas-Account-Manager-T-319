import type { LauncherItemV1 } from "@/lib/app-launcher";
import { LauncherIcon } from "@/components/app-launcher/launcher-icons";

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function AppLauncherGrid({ items }: { items: LauncherItemV1[] }) {
  if (!items.length) {
    return (
      <p className="text-center text-xs" style={{ color: "var(--dashboard-text-muted)" }}>
        ショートカットがありません。「ショートカットを編集」から追加できます。
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
      {items.map((item) => {
        const external = isExternal(item.href);
        return (
          <a
            key={item.id}
            href={item.href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex flex-col items-center gap-2 rounded-2xl p-2 text-center transition-opacity hover:opacity-90 sm:p-3"
            style={{ color: "var(--dashboard-text)" }}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "var(--dashboard-nav-active-bg)" }}
            >
              <LauncherIcon name={item.icon} />
            </span>
            <span className="line-clamp-2 text-xs font-medium leading-tight">{item.title}</span>
          </a>
        );
      })}
    </div>
  );
}
