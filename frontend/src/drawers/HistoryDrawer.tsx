import { useCallback, useEffect, useState } from "react";
import { Search, Star, Edit2, Trash2 } from "lucide-react";

import { getSessions } from "@/api/chatApi";
import { Drawer } from "@/components/ui/Drawer";
import { SkeletonText } from "@/components/skeletons/SkeletonText";
import { useToast } from "@/hooks/useToast";
import type { ChatSession } from "@/types/ChatMessage";
import {
  formatRelativeTime,
  isToday,
  isYesterday,
  isWithinLastWeek,
} from "@/utils/formatDate";

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
}

type DateGroup = "Today" | "Yesterday" | "Last 7 days" | "Older";

function groupSessions(sessions: ChatSession[]): Record<DateGroup, ChatSession[]> {
  const groups: Record<DateGroup, ChatSession[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    Older: [],
  };
  for (const s of sessions) {
    if (isToday(s.updated_at)) groups.Today.push(s);
    else if (isYesterday(s.updated_at)) groups.Yesterday.push(s);
    else if (isWithinLastWeek(s.updated_at)) groups["Last 7 days"].push(s);
    else groups.Older.push(s);
  }
  return groups;
}

export function HistoryDrawer({
  open,
  onClose,
  activeSessionId,
  onSelectSession,
}: HistoryDrawerProps) {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!open) return;
    setIsLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    } finally {
      setIsLoading(false);
    }
  }, [open, addToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupSessions(filtered);
  const ORDER: DateGroup[] = ["Today", "Yesterday", "Last 7 days", "Older"];

  return (
    <Drawer open={open} onClose={onClose} side="left" width={240}>
      <div className="flex h-full flex-col">
        <div
          className="px-3 py-3"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <p
            className="text-panel-heading mb-3"
            style={{ color: "var(--color-text-primary)" }}
          >
            History
          </p>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-tertiary)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className="w-full rounded-md py-1.5 pl-7 pr-2 text-body outline-none"
              style={{
                backgroundColor: "var(--color-bg-hover)",
                border: "1px solid var(--color-border-subtle)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {isLoading ? (
            <div className="flex flex-col gap-1 px-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonText key={i} height="36px" className="rounded-lg" />
              ))}
            </div>
          ) : (
            ORDER.map((group) => {
              const items = groups[group];
              if (!items.length) return null;
              return (
                <div key={group} className="mb-2">
                  <p
                    className="px-3 py-1 text-ui-label uppercase"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {group}
                  </p>
                  {items.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const isHovered = hoveredId === session.id;
                    return (
                      <div
                        key={session.id}
                        className="group flex items-center rounded-md mx-1"
                        style={{
                          height: 36,
                          backgroundColor: isActive
                            ? "var(--color-bg-active)"
                            : isHovered
                            ? "var(--color-bg-hover)"
                            : "transparent",
                          cursor: "pointer",
                        }}
                        onMouseEnter={() => setHoveredId(session.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => { onSelectSession(session.id); onClose(); }}
                      >
                        <span
                          className="flex-1 truncate px-2 text-body"
                          style={{
                            color: isActive
                              ? "var(--color-text-primary)"
                              : "var(--color-text-secondary)",
                          }}
                        >
                          {session.title}
                        </span>
                        {isHovered ? (
                          <div className="flex shrink-0 items-center gap-0.5 pr-1">
                            <button
                              className="rounded p-1 transition-colors duration-[120ms]"
                              style={{ color: "var(--color-text-tertiary)" }}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Star session"
                            >
                              <Star size={12} />
                            </button>
                            <button
                              className="rounded p-1 transition-colors duration-[120ms]"
                              style={{ color: "var(--color-text-tertiary)" }}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Rename session"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              className="rounded p-1 transition-colors duration-[120ms]"
                              style={{ color: "var(--color-text-tertiary)" }}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Delete session"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="shrink-0 pr-2 text-ui-label"
                            style={{ color: "var(--color-text-tertiary)" }}
                          >
                            {formatRelativeTime(session.updated_at)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Drawer>
  );
}
