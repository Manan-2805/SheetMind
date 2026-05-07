import { useEffect, useState } from "react";
import { UserPlus, ChevronRight } from "lucide-react";

import { listUsers, setupUser } from "@/api/authApi";
import { useToast } from "@/hooks/useToast";

interface OnboardingPageProps {
  onComplete: (username: string) => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { addToast } = useToast();
  const [existingUsers, setExistingUsers] = useState<string[]>([]);
  const [mode, setMode] = useState<"select" | "new">("select");
  const [newUsername, setNewUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    listUsers().then((users) => {
      setExistingUsers(users);
      if (users.length === 0) setMode("new");
    });
    return () => clearTimeout(timer);
  }, []);

  const handleSelectUser = async (username: string) => {
    setIsLoading(true);
    try {
      await setupUser(username);
      localStorage.setItem("sheetmind-username", username);
      onComplete(username);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message ?? "Failed to login" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newUsername.trim();
    if (!name) return;
    if (existingUsers.map((u) => u.toLowerCase()).includes(name.toLowerCase())) {
      addToast({ type: "error", title: "Name taken", description: "That username already exists. Please select it from the list." });
      return;
    }
    setIsLoading(true);
    try {
      await setupUser(name);
      localStorage.setItem("sheetmind-username", name);
      onComplete(name);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Setup failed", description: e?.message ?? "Could not complete setup" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex h-full items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(12px)",
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border-default)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div className="mb-6 flex flex-col items-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
            style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            S
          </div>
          <h1
            className="text-page-heading text-center"
            style={{ color: "var(--color-text-primary)" }}
          >
            Welcome to SheetMind
          </h1>
          <p
            className="mt-1 text-body text-center"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Query your Excel files with natural language
          </p>
        </div>

        {existingUsers.length > 0 && (
          <div className="mb-4 flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-border-default)" }}>
            <button
              onClick={() => setMode("select")}
              className="flex-1 py-2 text-body transition-colors duration-[120ms]"
              style={{
                backgroundColor: mode === "select" ? "var(--color-accent)" : "transparent",
                color: mode === "select" ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              Select User
            </button>
            <button
              onClick={() => setMode("new")}
              className="flex-1 py-2 text-body transition-colors duration-[120ms]"
              style={{
                backgroundColor: mode === "new" ? "var(--color-accent)" : "transparent",
                color: mode === "new" ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              New User
            </button>
          </div>
        )}

        {mode === "select" && existingUsers.length > 0 && (
          <div className="flex flex-col gap-2">
            {existingUsers.map((user) => (
              <button
                key={user}
                onClick={() => !isLoading && handleSelectUser(user)}
                disabled={isLoading}
                className="flex items-center justify-between rounded-lg px-4 py-3 text-body transition-all duration-[120ms] active:scale-[0.97]"
                style={{
                  backgroundColor: "var(--color-bg-hover)",
                  border: "1px solid var(--color-border-default)",
                  color: "var(--color-text-primary)",
                  opacity: isLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-accent-subtle)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-default)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-hover)";
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                  >
                    {user.charAt(0).toUpperCase()}
                  </div>
                  <span>{user}</span>
                </div>
                <ChevronRight size={16} style={{ color: "var(--color-text-tertiary)" }} />
              </button>
            ))}
          </div>
        )}

        {mode === "new" && (
          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username-input"
                className="text-ui-label"
                style={{ color: "var(--color-text-secondary)" }}
              >
                YOUR NAME
              </label>
              <input
                id="username-input"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. Alex Chen"
                autoFocus
                className="w-full rounded-lg px-3 py-2 text-body outline-none transition-all duration-[120ms]"
                style={{
                  backgroundColor: "var(--color-bg-hover)",
                  border: "1px solid var(--color-border-default)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "var(--color-accent)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "var(--color-border-default)";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!newUsername.trim() || isLoading}
              className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-body-em font-semibold transition-all duration-[120ms] active:scale-[0.97]"
              style={{
                backgroundColor:
                  newUsername.trim() && !isLoading
                    ? "var(--color-accent)"
                    : "var(--color-bg-hover)",
                color: newUsername.trim() && !isLoading ? "#fff" : "var(--color-text-tertiary)",
                cursor: newUsername.trim() && !isLoading ? "pointer" : "not-allowed",
              }}
            >
              <UserPlus size={16} />
              {isLoading ? "Setting up..." : "Get Started"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
