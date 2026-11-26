import {
  Bookmark,
  Clock,
  Database,
  LayoutDashboard,
  LogOut,
  Package,
  PenLine,
  Settings,
  TableProperties,
} from "lucide-react";

import logo from "@/assets/logo.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";

type ActiveView =
  | "chat"
  | "data-sources"
  | "settings"
  | "saved-queries"
  | "artifacts"
  | "excel-editor"
  | "dashboards";
type ActiveDrawer = "history" | null;

interface SidebarProps {
  activeView: ActiveView;
  activeDrawer: ActiveDrawer;
  onViewChange: (view: ActiveView) => void;
  onDrawerToggle: (drawer: "history") => void;
  onNewChat: () => void;
}

interface SidebarButtonProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

function SidebarButton({ icon: Icon, label, isActive, onClick }: SidebarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={onClick}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-[120ms]",
              "active:scale-[0.97]"
            )}
            style={{
              backgroundColor: isActive ? "var(--color-accent-subtle)" : "transparent",
              color: isActive ? "var(--color-accent)" : "var(--color-text-tertiary)",
              border: isActive ? "1px solid var(--color-accent-border)" : "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--color-bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-tertiary)";
              }
            }}
            aria-label={label}
          >
            <Icon size={18} />
          </button>
        }
      />
      <TooltipContent
        side="right"
        style={{
          backgroundColor: "var(--color-bg-active)",
          border: "1px solid var(--color-border-default)",
          color: "var(--color-text-primary)",
          fontSize: "12px",
        }}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({
  activeView,
  activeDrawer,
  onViewChange,
  onDrawerToggle,
  onNewChat,
}: SidebarProps) {
  const handleLogout = () => {
    localStorage.removeItem("sheetmind-username");
    window.location.reload();
  };

  return (
    <div
      className="flex h-full w-[52px] shrink-0 flex-col items-center py-3 gap-1"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        borderRight: "1px solid var(--color-border-default)",
      }}
    >
      <img
        src={logo}
        alt="SheetMind"
        className="mb-2 flex h-8 w-8 shrink-0 rounded-sm object-contain shadow-sm"
        aria-hidden="true"
      />

      <div
        className="my-1 w-6"
        style={{
          height: "1px",
          backgroundColor: "var(--color-border-subtle)",
        }}
      />

      <SidebarButton icon={PenLine} label="New Chat" onClick={onNewChat} />
      <SidebarButton
        icon={Clock}
        label="Chat History"
        isActive={activeDrawer === "history"}
        onClick={() => onDrawerToggle("history")}
      />
      <SidebarButton
        icon={Bookmark}
        label="Saved Queries"
        isActive={activeView === "saved-queries"}
        onClick={() => onViewChange("saved-queries")}
      />
      <SidebarButton
        icon={TableProperties}
        label="Excel Editor"
        isActive={activeView === "excel-editor"}
        onClick={() => onViewChange("excel-editor")}
      />
      <SidebarButton
        icon={LayoutDashboard}
        label="Dashboards"
        isActive={activeView === "dashboards"}
        onClick={() => onViewChange("dashboards")}
      />
      <SidebarButton
        icon={Package}
        label="Artifacts"
        isActive={activeView === "artifacts"}
        onClick={() => onViewChange("artifacts")}
      />
      <SidebarButton
        icon={Database}
        label="Data Sources"
        isActive={activeView === "data-sources"}
        onClick={() => onViewChange("data-sources")}
      />

      <div className="flex-1" />

      <SidebarButton
        icon={Settings}
        label="Settings"
        isActive={activeView === "settings"}
        onClick={() => onViewChange("settings")}
      />

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-[120ms] active:scale-[0.97]"
              style={{ color: "var(--color-destructive)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--color-bg-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          }
        />
        <TooltipContent
          side="right"
          style={{
            backgroundColor: "var(--color-bg-active)",
            border: "1px solid var(--color-border-default)",
            color: "var(--color-text-primary)",
            fontSize: "12px",
          }}
        >
          Logout
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
