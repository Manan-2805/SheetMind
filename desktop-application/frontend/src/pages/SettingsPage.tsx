import { Eye, EyeOff, RefreshCw, Save, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  clearChatHistory,
  deleteAllFiles,
  getOllamaModels,
  getSettings,
  testLLM,
  updateSettings,
} from "@/api/settingsApi";
import { useCountdown } from "@/hooks/useCountdown";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import type { LLMProvider, Theme } from "@/types/Settings";

function parseTestErrorMessage(raw: string): string {
  // Try to extract message from Python openai error format:
  // "Error code: 401 - {'error': {'message': '...', ...}}"
  const match = raw.match(/'message':\s*'([^']+)'/);
  if (match) return match[1];
  // Try double-quoted JSON style
  const jsonMatch = raw.match(/"message":\s*"([^"]+)"/);
  if (jsonMatch) return jsonMatch[1];
  // Return raw but truncate if very long
  return raw.length > 200 ? raw.slice(0, 200) + "..." : raw;
}

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
    if (!isConfirming) {
      start();
      setIsConfirming(true);
    } else if (isRunning) {
      cancel();
      setIsConfirming(false);
    } else if (count === 0) {
      setIsLoading(true);
      cancel();
      setIsConfirming(false);
      await onConfirm();
      setIsLoading(false);
    }
  };

  const buttonText = isLoading
    ? "Processing..."
    : isConfirming && isRunning
      ? `Confirm in ${count}...`
      : isConfirming && count === 0
        ? "Confirm now"
        : label;

  return (
    <div
      className="flex items-center justify-between py-4"
      style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
    >
      <div>
        <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>
          {label}
        </p>
        <p className="text-body mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
          {description}
        </p>
      </div>
      <button
        onClick={handleClick}
        onBlur={() => {
          if (!isLoading) {
            cancel();
            setIsConfirming(false);
          }
        }}
        disabled={isLoading}
        className="rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-[120ms] active:scale-[0.97]"
        style={{
          border: isConfirming
            ? "1px solid var(--color-destructive)"
            : "1px solid var(--color-border-default)",
          color: isConfirming ? "var(--color-destructive)" : "var(--color-text-secondary)",
          backgroundColor: isConfirming ? "rgba(239, 68, 68, 0.1)" : "transparent",
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
  const hasFetchedRef = useRef(false);

  const [llmProvider, setLlmProvider] = useState<LLMProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [providerUrl, setProviderUrl] = useState("https://api.openai.com/v1");
  const [savedProviderUrl, setSavedProviderUrl] = useState("https://api.openai.com/v1");
  const [showApiKey, setShowApiKey] = useState(false);
  const [openaiModel, setOpenaiModel] = useState("gpt-4o");

  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModels, setOllamaModels] = useState<{ name: string }[]>([]);
  const [ollamaSelectedModel, setOllamaSelectedModel] = useState<string>("");

  const [resultRowLimit, setResultRowLimit] = useState<number>(500);
  const [openaiMaxTokens, setOpenaiMaxTokens] = useState<number>(4000);
  const [ollamaMaxTokens, setOllamaMaxTokens] = useState<number>(4000);
  const [autoSqlRetry, setAutoSqlRetry] = useState<boolean>(true);
  const [autoSqlRetryMax, setAutoSqlRetryMax] = useState<number>(3);
  const [autoChartDisplay, setAutoChartDisplay] = useState<boolean>(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const refreshOllamaModels = async () => {
    try {
      const data = await getOllamaModels();
      if (data && data.models) {
        setOllamaModels(data.models);
      }
    } catch {
      // Silence background refresh errors
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    getSettings()
      .then((s) => {
        setLlmProvider(s.llm_provider as LLMProvider);
        setApiKeySet(s.openai.api_key_set);
        setProviderUrl(s.openai.base_url);
        setSavedProviderUrl(s.openai.base_url);
        setOpenaiModel(s.openai.model);
        setOllamaUrl(s.ollama.url);
        setOllamaSelectedModel(s.ollama.model || "");
        setResultRowLimit(s.result_row_limit || 500);
        setOpenaiMaxTokens(s.openai.max_input_tokens || 4000);
        setOllamaMaxTokens(s.ollama.max_input_tokens || 4000);
        setAutoSqlRetry(s.auto_sql_retry !== undefined ? s.auto_sql_retry : true);
        setAutoSqlRetryMax(s.auto_sql_retry_max !== undefined ? s.auto_sql_retry_max : 3);
        setAutoChartDisplay(s.auto_chart_display !== undefined ? s.auto_chart_display : false);
      })
      .catch((err: { message?: string }) => {
        addToast({ type: "error", title: "Error", description: err.message });
      });

    void refreshOllamaModels();
  }, [addToast]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await testLLM({
        provider: llmProvider,
        api_key: llmProvider === "openai" ? apiKey : undefined,
        url: llmProvider === "openai" ? providerUrl : ollamaUrl,
        model: llmProvider === "openai" ? openaiModel : undefined,
      });

      if (res.success) {
        setTestStatus({ type: "success", message: res.message || "Connected successfully!" });
        if (llmProvider === "ollama" && res.models) {
          setOllamaModels(res.models.map((m) => ({ name: m })));
        }
      } else {
        setTestStatus({ type: "error", message: res.message || "Connection failed." });
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setTestStatus({ type: "error", message: e.message || "An unexpected error occurred." });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const saved = await updateSettings({
        theme,
        llm_provider: llmProvider,
        openai: {
          api_key: apiKey.trim(),
          base_url: providerUrl,
          model: openaiModel.trim(),
          max_input_tokens: openaiMaxTokens,
        },
        ollama: { url: ollamaUrl, model: ollamaSelectedModel, max_input_tokens: ollamaMaxTokens },
        result_row_limit: resultRowLimit,
        auto_sql_retry: autoSqlRetry,
        auto_sql_retry_max: autoSqlRetryMax,
        auto_chart_display: autoChartDisplay,
      });
      setApiKey("");
      setApiKeySet(saved.openai.api_key_set);
      setProviderUrl(saved.openai.base_url);
      setSavedProviderUrl(saved.openai.base_url);
      setOpenaiModel(saved.openai.model);
      addToast({
        type: "success",
        title: "Settings Saved",
        description: "All changes have been persisted.",
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      addToast({ type: "error", title: "Save Failed", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <header
        className="flex shrink-0 items-center justify-between border-b px-8 py-5"
        style={{ borderColor: "var(--color-border-default)" }}
      >
        <div>
          <h1 className="text-page-heading" style={{ color: "var(--color-text-primary)" }}>
            Settings
          </h1>
          <p className="text-body mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            Configure your application preferences and AI providers.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? "Saving..." : "Save All Changes"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8 scrollbar-thin">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Appearance Section */}
          <section>
            <h3
              className="text-ui-label mb-4 uppercase tracking-wider"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Appearance
            </h3>
            <div
              className="rounded-2xl p-6 space-y-6"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>
                    Theme
                  </p>
                  <p className="text-body text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                    Choose between light and dark mode
                  </p>
                </div>
                <div
                  className="flex gap-1 rounded-xl p-1"
                  style={{ backgroundColor: "var(--color-bg-hover)" }}
                >
                  {(["light", "dark"] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className="rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-all"
                      style={{
                        backgroundColor: theme === t ? "var(--color-bg-elevated)" : "transparent",
                        color:
                          theme === t ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                        boxShadow: theme === t ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* AI Provider Section */}
          <section>
            <h3
              className="text-ui-label mb-4 uppercase tracking-wider"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              AI Provider
            </h3>
            <div
              className="rounded-2xl p-6 space-y-6"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <div>
                <label
                  className="text-ui-label mb-2 block"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  SELECT PROVIDER
                </label>
                <select
                  value={llmProvider}
                  onChange={(e) => setLlmProvider(e.target.value as LLMProvider)}
                  className="w-full rounded-xl px-4 py-2.5 text-body outline-none transition-all focus:ring-2 focus:ring-[var(--color-accent)]"
                  style={{
                    backgroundColor: "var(--color-bg-hover)",
                    border: "1px solid var(--color-border-default)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="openai">OpenAI-compatible</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              <div
                className="h-px w-full"
                style={{ backgroundColor: "var(--color-border-subtle)" }}
              />

              {llmProvider === "openai" ? (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="provider-url" className="text-ui-label mb-2 block">
                      API BASE URL
                    </label>
                    <input
                      id="provider-url"
                      type="url"
                      value={providerUrl}
                      onChange={(e) => {
                        setProviderUrl(e.target.value);
                        setTestStatus(null);
                      }}
                      placeholder="https://api.openai.com/v1"
                      className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-hover)] px-4 py-2.5 text-body"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="provider-key"
                      className="text-ui-label mb-2 block"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      API KEY
                    </label>
                    <div className="relative">
                      <input
                        id="provider-key"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setTestStatus(null);
                        }}
                        placeholder={
                          apiKeySet && providerUrl.trim().replace(/\/+$/, "") === savedProviderUrl
                            ? "Key saved for this URL"
                            : "Enter the key for this provider"
                        }
                        className="w-full rounded-xl px-4 py-2.5 pr-12 text-body outline-none transition-all focus:ring-2 focus:ring-[var(--color-accent)]"
                        style={{
                          backgroundColor: "var(--color-bg-hover)",
                          border: "1px solid var(--color-border-default)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-[var(--color-bg-active)]"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="provider-model"
                        className="text-ui-label mb-2 block"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        MODEL
                      </label>
                      <input
                        id="provider-model"
                        value={openaiModel}
                        onChange={(e) => {
                          setOpenaiModel(e.target.value);
                          setTestStatus(null);
                        }}
                        className="w-full rounded-xl px-4 py-2.5 text-body outline-none"
                        style={{
                          backgroundColor: "var(--color-bg-hover)",
                          border: "1px solid var(--color-border-default)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="text-ui-label mb-2 block"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        MAX TOKENS
                      </label>
                      <input
                        type="number"
                        value={openaiMaxTokens}
                        onChange={(e) => setOpenaiMaxTokens(parseInt(e.target.value) || 4000)}
                        className="w-full rounded-xl px-4 py-2.5 text-body outline-none"
                        style={{
                          backgroundColor: "var(--color-bg-hover)",
                          border: "1px solid var(--color-border-default)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label
                      className="text-ui-label mb-2 block"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      OLLAMA SERVER URL
                    </label>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full rounded-xl px-4 py-2.5 text-body outline-none"
                      style={{
                        backgroundColor: "var(--color-bg-hover)",
                        border: "1px solid var(--color-border-default)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="text-ui-label mb-2 block"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        MODEL
                      </label>
                      <select
                        value={ollamaSelectedModel}
                        onChange={(e) => setOllamaSelectedModel(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-body outline-none"
                        style={{
                          backgroundColor: "var(--color-bg-hover)",
                          border: "1px solid var(--color-border-default)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        <option value="">Select a model</option>
                        {ollamaModels.map((m) => (
                          <option key={m.name} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        className="text-ui-label mb-2 block"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        MAX TOKENS
                      </label>
                      <input
                        type="number"
                        value={ollamaMaxTokens}
                        onChange={(e) => setOllamaMaxTokens(parseInt(e.target.value) || 4000)}
                        className="w-full rounded-xl px-4 py-2.5 text-body outline-none"
                        style={{
                          backgroundColor: "var(--color-bg-hover)",
                          border: "1px solid var(--color-border-default)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.99]"
                  style={{
                    backgroundColor: "var(--color-bg-hover)",
                    border: "1px solid var(--color-border-default)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {isTesting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Zap
                      size={16}
                      className={testStatus?.type === "success" ? "text-success" : ""}
                    />
                  )}
                  {isTesting ? "Testing connection..." : "Test connection"}
                </button>

                {testStatus && (
                  <div
                    className="rounded-xl px-4 py-3 text-xs font-medium animate-in fade-in slide-in-from-top-2"
                    style={{
                      backgroundColor:
                        testStatus.type === "success"
                          ? "var(--color-success-subtle)"
                          : "var(--color-destructive-subtle)",
                      color:
                        testStatus.type === "success"
                          ? "var(--color-success)"
                          : "var(--color-destructive)",
                      border: `1px solid ${testStatus.type === "success" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                    }}
                  >
                    {testStatus.type === "error"
                      ? parseTestErrorMessage(testStatus.message)
                      : testStatus.message}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Chat Behavior Section */}
          <section>
            <h3
              className="text-ui-label mb-4 uppercase tracking-wider"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Chat Behavior
            </h3>
            <div
              className="rounded-2xl px-6"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              {/* Result Row Limit */}
              <div
                className="flex items-center justify-between py-4"
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <div>
                  <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>
                    Result Row Limit
                  </p>
                  <p
                    className="text-body mt-0.5 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Max rows returned per query
                  </p>
                </div>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={resultRowLimit}
                  onChange={(e) => setResultRowLimit(parseInt(e.target.value) || 500)}
                  className="w-20 rounded-lg px-2 py-1.5 text-body outline-none text-center"
                  style={{
                    backgroundColor: "var(--color-bg-hover)",
                    border: "1px solid var(--color-border-default)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Auto SQL Retry */}
              <div
                className="flex items-center justify-between py-4"
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <div>
                  <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>
                    Auto SQL Error Retry
                  </p>
                  <p
                    className="text-body mt-0.5 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Automatically correct SQL syntax errors and retry query execution
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={autoSqlRetry}
                    onChange={(e) => setAutoSqlRetry(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div
                    className="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent)] peer-checked:after:translate-x-full peer-focus:outline-none"
                    style={{ transition: "background-color 0.2s" }}
                  />
                </label>
              </div>

              {/* Max Retry Attempts */}
              {autoSqlRetry && (
                <div
                  className="flex items-center justify-between py-4 animate-in fade-in slide-in-from-top-1"
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                >
                  <div>
                    <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>
                      Max Retry Attempts
                    </p>
                    <p
                      className="text-body mt-0.5 text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      Number of automatic correction attempts
                    </p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={autoSqlRetryMax}
                    onChange={(e) => setAutoSqlRetryMax(parseInt(e.target.value) || 3)}
                    className="w-16 rounded-lg px-2 py-1.5 text-body outline-none text-center"
                    style={{
                      backgroundColor: "var(--color-bg-hover)",
                      border: "1px solid var(--color-border-default)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
              )}

              {/* Auto-Generate Chart */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-body-em" style={{ color: "var(--color-text-primary)" }}>
                    Auto-Generate Charts
                  </p>
                  <p
                    className="text-body mt-0.5 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Suggest and display chart visualization above result tables
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={autoChartDisplay}
                    onChange={(e) => setAutoChartDisplay(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div
                    className="peer h-6 w-11 rounded-full bg-gray-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-accent)] peer-checked:after:translate-x-full peer-focus:outline-none"
                    style={{ transition: "background-color 0.2s" }}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Data & Performance Section */}
          <section>
            <h3
              className="text-ui-label mb-4 uppercase tracking-wider"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Data & Performance
            </h3>
            <div
              className="rounded-2xl px-6"
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              <DestructiveButton
                label="Clear Chat History"
                description="Delete all conversation data permanently"
                onConfirm={async () => {
                  await clearChatHistory();
                  addToast({ type: "success", title: "History Cleared" });
                }}
              />
              <DestructiveButton
                label="Delete All Files"
                description="Wipe all uploaded datasets and partitions"
                onConfirm={async () => {
                  await deleteAllFiles();
                  addToast({ type: "success", title: "Files Deleted" });
                }}
              />
            </div>
          </section>

          <div className="pb-12 pt-4 text-center">
            <p
              className="text-[10px] uppercase tracking-widest"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              SheetMind Production v1.0.4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
