import {
  BarChart2,
  Mail,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  UserSearch,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const items = [
  { icon: UserSearch, label: "Physician discovery", to: "/" },
  { icon: Mail, label: "Campaigns", to: "/campaigns" },
  { icon: BarChart2, label: "Dashboard", to: "/dashboard" },
];

function SidebarButton({ icon: Icon, label, isCollapsed, className, ...props }) {
  return (
    <button
      className={cn(
        "group relative flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed && "justify-center px-0",
        className,
      )}
      {...props}
    >
      <Icon size={16} />
      {!isCollapsed && <span>{label}</span>}
      {isCollapsed && (
        <span className="pointer-events-none absolute left-12 z-20 hidden rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground group-hover:block">
          {label}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <aside
      className={cn(
        "flex min-h-screen shrink-0 flex-col border-r border-border bg-background transition-all",
        isCollapsed ? "w-[52px]" : "w-[220px]",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        {!isCollapsed && <span className="text-sm font-medium">DocNexus</span>}
        {!isCollapsed && (
          <button
            aria-label="Collapse sidebar"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setIsCollapsed(true)}
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-0",
                  isActive && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Icon size={16} />
              {!isCollapsed && <span>{item.label}</span>}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-12 z-20 hidden rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground group-hover:block">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-2">
        <SidebarButton icon={Settings} label="Settings" isCollapsed={isCollapsed} />
        <SidebarButton
          icon={theme === "light" ? Moon : Sun}
          label={theme === "light" ? "Dark mode" : "Light mode"}
          isCollapsed={isCollapsed}
          onClick={toggle}
        />
        {isCollapsed && (
          <button
            aria-label="Expand sidebar"
            className="flex h-10 w-full items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setIsCollapsed(false)}
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
