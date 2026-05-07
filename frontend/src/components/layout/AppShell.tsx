import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useCallback, useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ArtifactsDrawer } from "@/drawers/ArtifactsDrawer";
import { HistoryDrawer } from "@/drawers/HistoryDrawer";
import { SavedQueriesDrawer } from "@/drawers/SavedQueriesDrawer";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toast } from "@/components/ui/Toast";
import { useChat } from "@/hooks/useChat";

import { ChatPage } from "@/pages/ChatPage";
import { DataSourcesPage } from "@/pages/DataSourcesPage";
import { SettingsPage } from "@/pages/SettingsPage";

type ActiveView = "chat" | "data-sources" | "settings";
type ActiveDrawer = "history" | "artifacts" | "saved-queries" | null;

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
    const match = location.pathname.match(/^\/chat\/([^/]+)$/);
    if (match && match[1] !== "new") {
      const sessionId = match[1];
      if (sessionId !== activeSessionId) {
        selectSession(sessionId);
      }
    }
  }, [location.pathname, activeSessionId, selectSession]);

  const getActiveView = (): ActiveView => {
    if (location.pathname.startsWith("/data-sources")) return "data-sources";
    if (location.pathname.startsWith("/settings")) return "settings";
    return "chat";
  };

  const handleViewChange = useCallback((view: ActiveView) => {
    if (view === "chat") navigate("/chat/new");
    if (view === "data-sources") navigate("/data-sources");
    if (view === "settings") navigate("/settings");
    setActiveDrawer(null);
  }, [navigate]);

  const handleDrawerToggle = useCallback(
    (drawer: "history" | "artifacts" | "saved-queries") => {
      setActiveDrawer((prev) => (prev === drawer ? null : drawer));
    },
    []
  );

  const handleNewChat = useCallback(() => {
    startNewChat();
    navigate("/chat/new");
    setActiveDrawer(null);
  }, [startNewChat, navigate]);

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      navigate(`/chat/${sessionId}`);
      // selectSession is called by the useEffect above
    },
    [navigate]
  );

  const handleRunQuery = useCallback(
    (nlQuery: string) => {
      navigate("/chat/new");
      setActiveDrawer(null);
      sendChatMessage(nlQuery);
    },
    [sendChatMessage, navigate]
  );

  const handleChatSent = useCallback(async (content: string, files?: string[]) => {
    await sendChatMessage(content, files);
  }, [sendChatMessage]);

  // When a message is sent in a "new" chat, we should ideally navigate to the new session ID.
  // We will handle this in useChat to return the new session ID and navigate there.
  // We'll update useChat to optionally take a navigate callback, or we handle it here.
  
  return (
    <TooltipProvider delayDuration={500}>
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

        <ArtifactsDrawer
          open={activeDrawer === "artifacts"}
          onClose={() => setActiveDrawer(null)}
        />

        <SavedQueriesDrawer
          open={activeDrawer === "saved-queries"}
          onClose={() => setActiveDrawer(null)}
          onRunQuery={handleRunQuery}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/chat/new" replace />} />
            <Route path="/chat/*" element={
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
              />
            } />
            <Route path="/data-sources" element={<DataSourcesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>

        <Toast />
      </div>
    </TooltipProvider>
  );
}
