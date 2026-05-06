import { useEffect, useState } from "react";

import { setupUser } from "@/api/authApi";
import { useToast } from "@/hooks/useToast";

interface OnboardingPageProps {
  onComplete: (username: string) => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { addToast } = useToast();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    setIsLoading(true);
    try {
      await setupUser(name);
      localStorage.setItem("sheetmind-username", name);
      onComplete(name);
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({
        type: "error",
        title: "Setup failed",
        description: e?.message ?? "Could not complete setup",
      });
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alex Chen"
              autoFocus
              className="w-full rounded-lg px-3 py-2 text-body outline-none transition-all duration-[120ms]"
              style={{
                backgroundColor: "var(--color-bg-hover)",
                border: "1px solid var(--color-border-default)",
                color: "var(--color-text-primary)",
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor =
                  "var(--color-accent)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor =
                  "var(--color-border-default)";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim() || isLoading}
            className="w-full rounded-lg py-2.5 text-body-em font-semibold transition-all duration-[120ms] active:scale-[0.97]"
            style={{
              backgroundColor:
                username.trim() && !isLoading
                  ? "var(--color-accent)"
                  : "var(--color-bg-hover)",
              color: username.trim() && !isLoading ? "#fff" : "var(--color-text-tertiary)",
              cursor: username.trim() && !isLoading ? "pointer" : "not-allowed",
            }}
          >
            {isLoading ? "Setting up..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
