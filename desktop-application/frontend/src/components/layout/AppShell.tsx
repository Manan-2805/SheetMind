import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toast } from "@/components/ui/Toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HistoryDrawer } from "@/drawers/HistoryDrawer";
import { useChat } from "@/hooks/useChat";
import { ArtifactsPage } from "@/pages/ArtifactsPage";
import { ChatPage } from "@/pages/ChatPage";
import { DataSourcesPage } from "@/pages/DataSourcesPage";
import { SavedQueriesPage } from "@/pages/SavedQueriesPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { websocketService } from "@/services/websocketService";

const ExcelEditorPage = lazy(() =>
  import("@/pages/ExcelEditorPage").then((module) => ({ default: module.ExcelEditorPage }))
);
const DashboardsPage = lazy(() =>
  import("@/pages/DashboardsPage").then((module) => ({ default: module.DashboardsPage }))
);

const pageFallback = (
  <div role="status" className="p-6 text-sm">
    Loading page…
  </div>
);

type ActiveView =
  | "chat"
  | "data-sources"
  | "settings"
  | "saved-queries"
  | "artifacts"
  | "excel-editor"
  | "dashboards";
type ActiveDrawer = "history" | null;

export function AppShell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);

  useEffect(() => {
    const username = localStorage.getItem("sheetmind-username") || "default";
    websocketService.connect(username);
    return () => {
      websocketService.disconnect();
    };
  }, []);

  const {
    activeSessionId,
    messages,
    isLoadingMessages,
    isSending,
    stopGeneration,
    loadSessions,
    selectSession,
    startNewChat,
    sendChatMessage,
    deleteMessageBranch,
    editMessage,
    regenerateResponse,
    setMessages,
    followups,
    sqlRetryStatus,
    sendError,
  } = useChat();

  // Sync route param with chat session
  useEffect(() => {
    const match = pathname.match(/^\/([^/]+)$/);
    // Ignore routes that are named paths
    const isNamedPath = [
      "data-sources",
      "settings",
      "saved-queries",
      "artifacts",
      "excel-editor",
      "dashboards",
    ].includes(match?.[1] ?? "");

    if (match && match[1] !== "" && !isNamedPath) {
      const sessionId = match[1];
      if (sessionId !== activeSessionId && !isSending) {
        selectSession(sessionId);
      }
    } else if (pathname === "/" && activeSessionId && !isSending) {
      startNewChat();
    }
  }, [pathname, activeSessionId, isSending, selectSession, startNewChat]);

  const getActiveView = (): ActiveView => {
    if (pathname.startsWith("/data-sources")) return "data-sources";
    if (pathname.startsWith("/saved-queries")) return "saved-queries";
    if (pathname.startsWith("/artifacts")) return "artifacts";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/excel-editor")) return "excel-editor";
    if (pathname.startsWith("/dashboards")) return "dashboards";
    return "chat";
  };

  const handleViewChange = useCallback(
    (view: ActiveView) => {
      if (view === "chat") navigate("/");
      if (view === "data-sources") navigate("/data-sources");
      if (view === "saved-queries") navigate("/saved-queries");
      if (view === "artifacts") navigate("/artifacts");
      if (view === "settings") navigate("/settings");
      if (view === "excel-editor") navigate("/excel-editor");
      if (view === "dashboards") navigate("/dashboards");
      setActiveDrawer(null);
    },
    [navigate]
  );

  const handleDrawerToggle = useCallback((drawer: "history") => {
    setActiveDrawer((prev) => (prev === drawer ? null : drawer));
  }, []);

  const handleNewChat = useCallback(() => {
    startNewChat();
    navigate("/");
    setActiveDrawer(null);
  }, [startNewChat, navigate]);

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      navigate(`/${sessionId}`);
    },
    [navigate]
  );

  const handleChatSent = useCallback(
    async (content: string, files?: string[]) => {
      await sendChatMessage(content, files);
    },
    [sendChatMessage]
  );

  const handleUpdateMessage = useCallback(
    (msg: import("@/types/ChatMessage").ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    },
    [setMessages]
  );

  return (
    <TooltipProvider delay={300}>
      <div className="desktop-workspace flex h-screen gap-2.5 overflow-hidden p-2.5">
        <Sidebar
          activeView={getActiveView()}
          activeDrawer={activeDrawer}
          onViewChange={handleViewChange}
          onDrawerToggle={handleDrawerToggle}
          onNewChat={handleNewChat}
        />

        <div className="relative flex min-w-0 flex-1">
          <HistoryDrawer
            open={activeDrawer === "history"}
            onClose={() => setActiveDrawer(null)}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
          />
          <main className="desktop-glass desktop-content flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
            <Routes>
              <Route path="/data-sources" element={<DataSourcesPage />} />
              <Route path="/saved-queries" element={<SavedQueriesPage />} />
              <Route path="/artifacts" element={<ArtifactsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/excel-editor"
                element={
                  <Suspense fallback={pageFallback}>
                    <ExcelEditorPage onViewChange={handleViewChange} />
                  </Suspense>
                }
              />
              <Route
                path="/dashboards"
                element={
                  <Suspense fallback={pageFallback}>
                    <DashboardsPage />
                  </Suspense>
                }
              />

              <Route
                path="/:sessionId"
                element={
                  <ChatPage
                    key={activeSessionId ?? "new"}
                    onNewChat={handleNewChat}
                    messages={messages}
                    isLoadingMessages={isLoadingMessages}
                    isSending={isSending}
                    stopGeneration={stopGeneration}
                    sendError={sendError}
                    sendChatMessage={handleChatSent}
                    loadSessions={loadSessions}
                    activeSessionId={activeSessionId}
                    startNewChat={startNewChat}
                    onUpdateMessage={handleUpdateMessage}
                    onDeleteMessage={deleteMessageBranch}
                    onEditMessage={editMessage}
                    onRegenerateSubmit={regenerateResponse}
                    followups={followups}
                    onFollowupClick={(text) => sendChatMessage(text)}
                    sqlRetryStatus={sqlRetryStatus}
                  />
                }
              />
              <Route
                path="/"
                element={
                  <ChatPage
                    key="new"
                    onNewChat={handleNewChat}
                    messages={[]}
                    isLoadingMessages={false}
                    isSending={isSending}
                    stopGeneration={stopGeneration}
                    sendError={sendError}
                    sendChatMessage={handleChatSent}
                    loadSessions={loadSessions}
                    activeSessionId={null}
                    startNewChat={startNewChat}
                    onUpdateMessage={handleUpdateMessage}
                    onDeleteMessage={deleteMessageBranch}
                    onEditMessage={editMessage}
                    onRegenerateSubmit={regenerateResponse}
                    followups={[]}
                    onFollowupClick={(text) => sendChatMessage(text)}
                    sqlRetryStatus={null}
                  />
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        <Toast />
      </div>
    </TooltipProvider>
  );
}
