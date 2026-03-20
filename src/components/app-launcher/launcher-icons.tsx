import {
  Calendar,
  Folder,
  Home,
  Link as LinkIcon,
  Settings,
  User,
} from "iconoir-react";
import type { LauncherIconKey } from "@/lib/app-launcher";

const ICON_SIZE = 22;
const STROKE = 1.5;

export function LauncherIcon({
  name,
  className,
}: {
  name: LauncherIconKey | undefined;
  className?: string;
}) {
  const style = { color: "var(--dashboard-text)" };
  const common = { width: ICON_SIZE, height: ICON_SIZE, strokeWidth: STROKE, style, className };
  switch (name) {
    case "home":
      return <Home {...common} />;
    case "user":
      return <User {...common} />;
    case "settings":
      return <Settings {...common} />;
    case "calendar":
      return <Calendar {...common} />;
    case "folder":
      return <Folder {...common} />;
    case "link":
      return <LinkIcon {...common} />;
    default:
      return <LinkIcon {...common} />;
  }
}
