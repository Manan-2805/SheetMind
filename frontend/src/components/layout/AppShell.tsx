import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useCallback, useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

import { HistoryDrawer } from "@/drawers/HistoryDrawer";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toast } from "@/components/ui/Toast";
import { useChat } from "@/hooks/useChat";

import { ChatPage } from "@/pages/ChatPage";
import { DataSourcesPage } from "@/pages/DataSourcesPage";
import { SavedQueriesPage } from "@/pages/SavedQueriesPage";
import { ArtifactsPage } from "@/pages/ArtifactsPage";
import { SettingsPage } from "@/pages/SettingsPage";

type ActiveView = "chat" | "data-sources" | "settings" | "saved-queries" | "artifacts";
type ActiveDrawer = "history" | null;

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>(null);

  const {
    activeSessionId,
    messages,
    isLoadingMessages,
    isSending,
    loadSessions,
    selectSession,
    startNewChat,
    sendChatMessage,
    setMessages,
  } = useChat();

  const handleRegeneratedMessage = useCallback((msg: import("@/types/ChatMessage").ChatMessage) => {
    setMessages((prev) => [...prev.filter((m) => !m.is_typing), msg]);
  }, [setMessages]);

  // Sync route param with chat session
  useEffect(() => {
    const match = location.pathname.match(/^\/([^/]+)$/);
    // Ignore routes that are named paths
    const isNamedPath = [
      "data-sources", "settings", "saved-queries", "artifacts"
    ].includes(match?.[1] ?? "");
    
    if (match && match[1] !== "" && !isNamedPath) {
      const sessionId = match[1];
      if (sessionId !== activeSessionId) {
        selectSession(sessionId);
      }
    } else if (location.pathname === "/" && activeSessionId) {
      // If we go back to root and there is an active session, let's start a new chat?
      // Or just leave it. Usually "/" means new chat
      startNewChat();
    }
  }, [location.pathname, activeSessionId, selectSession, startNewChat]);

  const getActiveView = (): ActiveView => {
    if (location.pathname.startsWith("/data-sources")) return "data-sources";
    if (location.pathname.startsWith("/saved-queries")) return "saved-queries";
    if (location.pathname.startsWith("/artifacts")) return "artifacts";
    if (location.pathname.startsWith("/settings")) return "settings";
    return "chat";
  };

  const handleViewChange = useCallback((view: ActiveView) => {
    if (view === "chat") navigate("/");
    if (view === "data-sources") navigate("/data-sources");
    if (view === "saved-queries") navigate("/saved-queries");
    if (view === "artifacts") navigate("/artifacts");
    if (view === "settings") navigate("/settings");
    setActiveDrawer(null);
  }, [navigate]);

  const handleDrawerToggle = useCallback(
    (drawer: "history") => {
      setActiveDrawer((prev) => (prev === drawer ? null : drawer));
    },
    []
  );

  const handleNewChat = useCallback(() => {
    startNewChat();
    navigate("/");
    setActiveDrawer(null);
  }, [startNewChat, navigate]);

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      navigate(`/${sessionId}`);
      // selectSession is called by the useEffect above
    },
    [navigate]
  );

  const handleChatSent = useCallback(async (content: string, files?: string[]) => {
    await sendChatMessage(content, files);
  }, [sendChatMessage]);

  const handleUpdateMessage = useCallback((msg: import("@/types/ChatMessage").ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
  }, [setMessages]);

  return (
    <TooltipProvider delay={500}>
      <div
        className="flex h-screen overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-base)" }}
      >
        <Sidebar
          activeView={getActiveView()}
          activeDrawer={activeDrawer}
          onViewChange={handleViewChange}
          onDrawerToggle={handleDrawerToggle}
          onNewChat={handleNewChat}
        />

        <HistoryDrawer
          open={activeDrawer === "history"}
          onClose={() => setActiveDrawer(null)}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/data-sources" element={<DataSourcesPage />} />
            <Route path="/saved-queries" element={<SavedQueriesPage />} />
            <Route path="/artifacts" element={<ArtifactsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            <Route path="/:sessionId" element={
              <ChatPage
                onNewChat={handleNewChat}
                messages={messages}
                isLoadingMessages={isLoadingMessages}
                isSending={isSending}
                sendChatMessage={handleChatSent}
                loadSessions={loadSessions}
                startNewChat={startNewChat}
                activeSessionId={activeSessionId}
                onRegeneratedMessage={handleRegeneratedMessage}
                onUpdateMessage={handleUpdateMessage}
              />
            } />
            <Route path="/" element={
              <ChatPage
                onNewChat={handleNewChat}
                messages={messages}
                isLoadingMessages={isLoadingMessages}
                isSending={isSending}
                sendChatMessage={handleChatSent}
                loadSessions={loadSessions}
                startNewChat={startNewChat}
                activeSessionId={activeSessionId}
                onRegeneratedMessage={handleRegeneratedMessage}
                onUpdateMessage={handleUpdateMessage}
              />
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Toast />
      </div>
    </TooltipProvider>
  );
}
