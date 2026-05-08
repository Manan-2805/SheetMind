import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import {
  clearChatHistory,
  deleteAllFiles,
  getSettings,
  getOllamaModels,
  testLLM,
  updateSettings,
} from "@/api/settingsApi";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useCountdown } from "@/hooks/useCountdown";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import type { LLMProvider, Theme } from "@/types/Settings";

type NavSection = "appearance" | "llm" | "data";

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "llm", label: "LLM Provider" },
  { id: "data", label: "Data" },
];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const LLM_OPTIONS: { value: LLMProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "ollama", label: "Ollama" },
];

interface DestructiveButtonProps {
  label: string;
  description: string;
  onConfirm: () => Promise<void>;
}

function DestructiveButton({ label, description, onConfirm }: DestructiveButtonProps) {
  const { count, isRunning, start, cancel } = useCountdown(3);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    if (!isRunning && !isConfirming) {
      start();
      setIsConfirming(true);
    } else if (isConfirming) {
      setIsLoading(true);
      cancel();
      setIsConfirming(false);
      await onConfirm();
      setIsLoading(false);
    }
  };

  const prevCountRef = useRef(count);
  useEffect(() => {
    if (prevCountRef.current !== 0 && count === 0 && isRunning) {
      setIsConfirming(false);
    }
    prevCountRef.current = count;
  }, [count, isRunning]);

  const buttonText = isLoading
    ? "Processing..."
    : isConfirming && isRunning
      ? `Confirm in ${count}...`
      : isConfirming && count === 0
        ? "Confirm now"
        : label;

  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
      <div>
        <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>{label}</p>
        <p className="text-body mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>{description}</p>
      </div>
      <button
        onClick={handleClick}
        onBlur={() => { if (!isLoading) { cancel(); setIsConfirming(false); } }}
        disabled={isLoading}
        className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.97]"
        style={{
          border: isConfirming
            ? "1px solid var(--color-destructive)"
            : "1px solid var(--color-border-default)",
          color: isConfirming
            ? "var(--color-destructive)"
            : "var(--color-text-secondary)",
          backgroundColor: "transparent",
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<NavSection>("appearance");
  const [llmProvider, setLlmProvider] = useState<LLMProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [openaiModel, setOpenaiModel] = useState("gpt-4o");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [pullModelInput, setPullModelInput] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<{ status: string; completed?: number; total?: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [isSavingLLM, setIsSavingLLM] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<{ name: string }[]>([]);
  const [ollamaSelectedModel, setOllamaSelectedModel] = useState<string>("");
  const [maxConcurrentUploads, setMaxConcurrentUploads] = useState<number>(1);
  const [resultRowLimit, setResultRowLimit] = useState<number>(500);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setLlmProvider(s.llm_provider as LLMProvider);
        setApiKey(s.openai.api_key);
        setOpenaiModel(s.openai.model);
        setOllamaUrl(s.ollama.url);
        setOllamaSelectedModel(s.ollama.model || "");
        setMaxConcurrentUploads(s.max_concurrent_uploads || 1);
        setResultRowLimit(s.result_row_limit || 500);
      })
      .catch((err: { message?: string }) => {
        addToast({ type: "error", title: "Error", description: err.message });
      });

    // fetch ollama models if ollama is selected
    getOllamaModels().then((data) => {
      if (data && data.models) {
        setOllamaModels(data.models);
      }
    }).catch(() => { });
  }, [addToast]);

  const handleThemeChange = async (t: Theme) => {
    setTheme(t);
    try {
      await updateSettings({ theme: t });
    } catch {
      // silently ignore update failures
    }
  };

  const handleTestLLM = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await testLLM({
        provider: llmProvider,
        api_key: llmProvider === "openai" ? apiKey : undefined,
        url: llmProvider === "ollama" ? ollamaUrl : undefined,
      });
      setTestResult("success");
    } catch {
      setTestResult("error");
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const handleSaveLLMSettings = async () => {
    setIsSavingLLM(true);
    try {
      await updateSettings({
        llm_provider: llmProvider,
        openai: { api_key: apiKey, model: openaiModel },
        ollama: { url: ollamaUrl, model: ollamaSelectedModel },
      });
      addToast({ type: "success", title: "Saved", description: `LLM provider set to ${llmProvider}` });
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Save failed", description: e?.message });
    } finally {
      setIsSavingLLM(false);
    }
  };

  const handlePullModel = async () => {
    if (!pullModelInput.trim()) return;
    setIsPulling(true);
    setPullProgress({ status: "Starting..." });
    try {
      const res = await fetch("http://localhost:8000/api/settings/pull-ollama-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: pullModelInput.trim() }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.error) throw new Error(data.error);
            setPullProgress(data);
          } catch {
            // ignore parse errors for partial lines
          }
        }
      }

      addToast({ type: "success", title: "Model pulled", description: pullModelInput.trim() });
      setPullModelInput("");

      // Refresh models
      const modelsData = await getOllamaModels();
      if (modelsData && modelsData.models) setOllamaModels(modelsData.models);

    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Pull failed", description: e?.message });
    } finally {
      setIsPulling(false);
      setPullProgress(null);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await clearChatHistory();
      addToast({ type: "success", title: "Cleared", description: `${res.deleted_sessions} sessions removed` });
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    }
  };

  const handleDeleteFiles = async () => {
    try {
      const res = await deleteAllFiles();
      addToast({ type: "success", title: "Deleted", description: `${res.deleted_files} files removed` });
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Error", description: e?.message });
    }
  };

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <nav
        className="w-[180px] shrink-0 overflow-y-auto py-8 px-2"
        style={{ borderRight: "1px solid var(--color-border-default)" }}
      >
        <p
          className="mb-3 px-3 text-ui-label uppercase"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Settings
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="mb-0.5 flex w-full items-center rounded-lg px-3 py-2 text-body transition-colors duration-[120ms]"
              style={{
                backgroundColor: isActive ? "var(--color-bg-active)" : "transparent",
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                borderLeft: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto px-8 py-8 scrollbar-thin">
        {activeSection === "appearance" && (
          <div>
            <h2 className="text-page-heading mb-6" style={{ color: "var(--color-text-primary)" }}>
              Appearance
            </h2>
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)" }}
            >
              <p className="text-panel-heading mb-3" style={{ color: "var(--color-text-primary)" }}>Theme</p>
              <SegmentedControl
                options={THEME_OPTIONS}
                value={theme}
                onChange={handleThemeChange}
                className="max-w-xs"
              />
            </div>
          </div>
        )}

        {activeSection === "llm" && (
          <div>
            <h2 className="text-page-heading mb-6" style={{ color: "var(--color-text-primary)" }}>
              LLM Provider
            </h2>
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)" }}
            >
              <SegmentedControl
                options={LLM_OPTIONS}
                value={llmProvider}
                onChange={setLlmProvider}
                className="mb-6 max-w-xs"
              />

              {llmProvider === "openai" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-ui-label mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                      API KEY
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-..."
                          className="w-full rounded-lg px-3 py-2 pr-10 text-body outline-none"
                          style={{
                            backgroundColor: "var(--color-bg-hover)",
                            border: "1px solid var(--color-border-default)",
                            color: "var(--color-text-primary)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey((p) => !p)}
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          style={{ color: "var(--color-text-tertiary)" }}
                          aria-label={showApiKey ? "Hide API key" : "Show API key"}
                        >
                          {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-ui-label mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                      MODEL
                    </label>
                    <select
                      value={openaiModel}
                      onChange={(e) => setOpenaiModel(e.target.value)}
                      className="w-full max-w-xs rounded-lg px-3 py-2 text-body outline-none"
                      style={{
                        backgroundColor: "var(--color-bg-hover)",
                        border: "1px solid var(--color-border-default)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTestLLM}
                      disabled={isTesting}
                      className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.97]"
                      style={{
                        backgroundColor: "var(--color-bg-hover)",
                        border: "1px solid var(--color-border-default)",
                        color: "var(--color-text-secondary)",
                        opacity: isTesting ? 0.7 : 1,
                      }}
                    >
                      {isTesting ? "Testing..." : "Test Connection"}
                    </button>
                    <button
                      onClick={handleSaveLLMSettings}
                      disabled={isSavingLLM}
                      className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.97]"
                      style={{
                        backgroundColor: "var(--color-accent)",
                        color: "#fff",
                        opacity: isSavingLLM ? 0.7 : 1,
                      }}
                    >
                      {isSavingLLM ? "Saving..." : "Save Settings"}
                    </button>
                    {testResult === "success" && (
                      <span style={{ color: "var(--color-success)" }} className="text-body-em">Connected</span>
                    )}
                    {testResult === "error" && (
                      <span style={{ color: "var(--color-destructive)" }} className="text-body-em">Failed</span>
                    )}
                  </div>
                </div>
              )}

              {llmProvider === "ollama" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-ui-label mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                      OLLAMA URL
                    </label>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      className="w-full max-w-sm rounded-lg px-3 py-2 text-body outline-none"
                      style={{
                        backgroundColor: "var(--color-bg-hover)",
                        border: "1px solid var(--color-border-default)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTestLLM}
                      disabled={isTesting}
                      className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.97]"
                      style={{ backgroundColor: "var(--color-accent)", color: "#fff", opacity: isTesting ? 0.7 : 1 }}
                    >
                      {isTesting ? "Testing..." : "Test Connection"}
                    </button>
                    {testResult === "success" && <span style={{ color: "var(--color-success)" }} className="text-body-em">✓ Connected</span>}
                    {testResult === "error" && <span style={{ color: "var(--color-destructive)" }} className="text-body-em">✗ Failed</span>}
                  </div>
                  <div>
                    <label className="text-ui-label mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                      DOWNLOADED MODELS
                    </label>
                    <select
                      value={ollamaSelectedModel}
                      onChange={(e) => setOllamaSelectedModel(e.target.value)}
                      className="w-full max-w-sm rounded-lg px-3 py-2 text-body outline-none"
                      style={{
                        backgroundColor: "var(--color-bg-hover)",
                        border: "1px solid var(--color-border-default)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      <option value="">Select a model</option>
                      {ollamaModels.map((m) => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-ui-label mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                      PULL NEW MODEL
                    </label>
                    <div className="flex max-w-sm gap-2">
                      <input
                        type="text"
                        value={pullModelInput}
                        onChange={(e) => setPullModelInput(e.target.value)}
                        placeholder="llama3, mistral, ..."
                        className="flex-1 rounded-lg px-3 py-2 text-body outline-none"
                        style={{
                          backgroundColor: "var(--color-bg-hover)",
                          border: "1px solid var(--color-border-default)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                      <button
                        onClick={handlePullModel}
                        disabled={isPulling || !pullModelInput.trim()}
                        className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms]"
                        style={{
                          backgroundColor: "var(--color-accent)",
                          color: "#fff",
                          opacity: isPulling || !pullModelInput.trim() ? 0.6 : 1,
                        }}
                      >
                        {isPulling ? "Pulling..." : "Pull"}
                      </button>
                    </div>
                    {isPulling && pullProgress && (
                      <div className="mt-2">
                        <div className="mb-1 flex justify-between text-ui-label" style={{ color: "var(--color-text-secondary)", maxWidth: 320 }}>
                          <span>{pullProgress.status}</span>
                          {pullProgress.total && pullProgress.completed && (
                            <span>{Math.round((pullProgress.completed / pullProgress.total) * 100)}%</span>
                          )}
                        </div>
                        <div className="overflow-hidden rounded-full bg-gray-200" style={{ height: 4, backgroundColor: "var(--color-bg-hover)", maxWidth: 320 }}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: "var(--color-accent)",
                              width: pullProgress.total ? `${Math.round((pullProgress.completed! / pullProgress.total) * 100)}%` : "100%",
                              backgroundImage: pullProgress.total ? "none" : "linear-gradient(90deg, var(--color-accent) 25%, var(--color-accent-hover) 50%, var(--color-accent) 75%)",
                              backgroundSize: "200% 100%",
                              animation: pullProgress.total ? "none" : "shimmer 1.5s infinite",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTestLLM}
                      disabled={isTesting}
                      className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.97]"
                      style={{ backgroundColor: "var(--color-bg-hover)", border: "1px solid var(--color-border-default)", color: "var(--color-text-secondary)", opacity: isTesting ? 0.7 : 1 }}
                    >
                      {isTesting ? "Testing..." : "Test Connection"}
                    </button>
                    <button
                      onClick={handleSaveLLMSettings}
                      disabled={isSavingLLM}
                      className="rounded-lg px-4 py-2 text-body-em transition-all duration-[120ms] active:scale-[0.97]"
                      style={{ backgroundColor: "var(--color-accent)", color: "#fff", opacity: isSavingLLM ? 0.7 : 1 }}
                    >
                      {isSavingLLM ? "Saving..." : "Save Settings"}
                    </button>
                    {testResult === "success" && <span style={{ color: "var(--color-success)" }} className="text-body-em">Connected</span>}
                    {testResult === "error" && <span style={{ color: "var(--color-destructive)" }} className="text-body-em">Failed</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "data" && (
          <div>
            <h2 className="text-page-heading mb-6" style={{ color: "var(--color-text-primary)" }}>
              Data
            </h2>
            <div
              className="rounded-xl px-6"
              style={{ backgroundColor: "var(--color-bg-elevated)", border: "1px solid var(--color-border-default)" }}
            >
              <div className="flex items-center justify-between py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <div>
                  <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>Max Concurrent Uploads</p>
                  <p className="text-body mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>Limit parallel processing to save system resources</p>
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxConcurrentUploads}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setMaxConcurrentUploads(val);
                    updateSettings({ max_concurrent_uploads: val }).catch(() => { });
                  }}
                  className="w-20 rounded-lg px-3 py-2 text-body outline-none text-center"
                  style={{
                    backgroundColor: "var(--color-bg-hover)",
                    border: "1px solid var(--color-border-default)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between py-4" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <div>
                  <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>Result Row Limit</p>
                  <p className="text-body mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>Max rows returned per result table</p>
                </div>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={resultRowLimit}
                  onChange={(e) => {
                    const val = Math.max(10, parseInt(e.target.value) || 10);
                    setResultRowLimit(val);
                    updateSettings({ result_row_limit: val }).catch(() => { });
                  }}
                  className="w-24 rounded-lg px-3 py-2 text-body outline-none text-center"
                  style={{
                    backgroundColor: "var(--color-bg-hover)",
                    border: "1px solid var(--color-border-default)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
              <DestructiveButton
                label="Clear Chat History"
                description="Permanently deletes all chat sessions and messages"
                onConfirm={handleClearHistory}
              />
              <DestructiveButton
                label="Delete All Files"
                description="Removes all uploaded Excel files and their data"
                onConfirm={handleDeleteFiles}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
