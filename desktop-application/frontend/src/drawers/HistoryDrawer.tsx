import { useCallback, useEffect, useState } from "react";

import { ChevronDown, ChevronRight, Edit2, Folder, FolderOpen, Search, Star, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getSessions } from "@/api/chatApi";
import { SkeletonText } from "@/components/skeletons/SkeletonText";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/hooks/useToast";
import type { ChatSession } from "@/types/ChatMessage";
import {
  formatRelativeTime,
  isToday,
  isWithinLastWeek,
  isYesterday,
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
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);

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
  const favorites = filtered.filter((s) => s.is_favorite);
  const nonFavorites = filtered.filter((s) => !s.is_favorite);
  const groups = groupSessions(nonFavorites);
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
            <>
              {favorites.length > 0 && (
                <div className="mb-4 px-2">
                  <div
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-200 border border-white/5 backdrop-blur-md"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                    }}
                    onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      {isFavoritesExpanded ? (
                        <FolderOpen size={14} style={{ color: "var(--color-accent)" }} />
                      ) : (
                        <Folder size={14} style={{ color: "var(--color-accent)" }} />
                      )}
                      <span
                        className="text-body font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        Favorites
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.25 text-[10px] font-semibold"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {favorites.length}
                      </span>
                    </div>
                    <div>
                      {isFavoritesExpanded ? (
                        <ChevronDown size={14} style={{ color: "var(--color-text-tertiary)" }} />
                      ) : (
                        <ChevronRight size={14} style={{ color: "var(--color-text-tertiary)" }} />
                      )}
                    </div>
                  </div>
                  
                  {isFavoritesExpanded && (
                    <div className="mt-1 flex flex-col gap-0.5 pl-1.5 border-l border-white/[0.04] ml-3.5">
                      {favorites.map((session) => {
                        const isActive = session.id === activeSessionId;
                        const isHovered = hoveredId === session.id;
                        return (
                          <div
                            key={session.id}
                            className="group flex items-center rounded-md"
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
                                  style={{ color: session.is_favorite ? "var(--color-accent)" : "var(--color-text-tertiary)" }}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const updated = await import("@/api/chatApi").then(m => m.updateSession(session.id, { is_favorite: !session.is_favorite }));
                                      setSessions(prev => prev.map(s => s.id === session.id ? updated : s));
                                    } catch {
                                      addToast({ type: "error", title: "Error", description: "Failed to update favorite status" });
                                    }
                                  }}
                                  aria-label="Star session"
                                >
                                  <Star size={12} fill={session.is_favorite ? "currentColor" : "none"} />
                                </button>
                                <button
                                  className="rounded p-1 transition-colors duration-[120ms]"
                                  style={{ color: "var(--color-text-tertiary)" }}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const newTitle = prompt("Enter new title for session:", session.title);
                                    if (newTitle && newTitle !== session.title) {
                                      try {
                                        const updated = await import("@/api/chatApi").then(m => m.updateSession(session.id, { title: newTitle }));
                                        setSessions(prev => prev.map(s => s.id === session.id ? updated : s));
                                      } catch {
                                        addToast({ type: "error", title: "Error", description: "Failed to rename session" });
                                      }
                                    }
                                  }}
                                  aria-label="Rename session"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  className="rounded p-1 transition-colors duration-[120ms]"
                                  style={{ color: "var(--color-text-tertiary)" }}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm("Are you sure you want to delete this session?")) {
                                      try {
                                        await import("@/api/chatApi").then(m => m.deleteSession(session.id));
                                        setSessions(prev => prev.filter(s => s.id !== session.id));
                                        if (activeSessionId === session.id) {
                                          navigate("/", { replace: true });
                                        }
                                      } catch {
                                        addToast({ type: "error", title: "Error", description: "Failed to delete session" });
                                      }
                                    }
                                  }}
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
                  )}
                </div>
              )}

              {ORDER.map((group) => {
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
                                style={{ color: session.is_favorite ? "var(--color-accent)" : "var(--color-text-tertiary)" }}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const updated = await import("@/api/chatApi").then(m => m.updateSession(session.id, { is_favorite: !session.is_favorite }));
                                    setSessions(prev => prev.map(s => s.id === session.id ? updated : s));
                                  } catch {
                                    addToast({ type: "error", title: "Error", description: "Failed to update favorite status" });
                                  }
                                }}
                                aria-label="Star session"
                              >
                                <Star size={12} fill={session.is_favorite ? "currentColor" : "none"} />
                              </button>
                              <button
                                className="rounded p-1 transition-colors duration-[120ms]"
                                style={{ color: "var(--color-text-tertiary)" }}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newTitle = prompt("Enter new title for session:", session.title);
                                  if (newTitle && newTitle !== session.title) {
                                    try {
                                      const updated = await import("@/api/chatApi").then(m => m.updateSession(session.id, { title: newTitle }));
                                      setSessions(prev => prev.map(s => s.id === session.id ? updated : s));
                                    } catch {
                                      addToast({ type: "error", title: "Error", description: "Failed to rename session" });
                                    }
                                  }
                                }}
                                aria-label="Rename session"
                               >
                                <Edit2 size={12} />
                              </button>
                              <button
                                className="rounded p-1 transition-colors duration-[120ms]"
                                style={{ color: "var(--color-text-tertiary)" }}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm("Are you sure you want to delete this session?")) {
                                    try {
                                      await import("@/api/chatApi").then(m => m.deleteSession(session.id));
                                      setSessions(prev => prev.filter(s => s.id !== session.id));
                                      if (activeSessionId === session.id) {
                                        navigate("/", { replace: true });
                                      }
                                    } catch {
                                      addToast({ type: "error", title: "Error", description: "Failed to delete session" });
                                    }
                                  }
                                }}
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
              })}
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}
