import { useCallback, useState } from "react";
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
  const [activeView, setActiveView] = useState<ActiveView>("chat");
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
  } = useChat();

  const handleViewChange = useCallback((view: ActiveView) => {
    setActiveView(view);
    setActiveDrawer(null);
  }, []);

  const handleDrawerToggle = useCallback(
    (drawer: "history" | "artifacts" | "saved-queries") => {
      setActiveDrawer((prev) => (prev === drawer ? null : drawer));
    },
    []
  );

  const handleNewChat = useCallback(async () => {
    await startNewChat();
    setActiveView("chat");
    setActiveDrawer(null);
  }, [startNewChat]);

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      setActiveView("chat");
      await selectSession(sessionId);
    },
    [selectSession]
  );

  const handleRunQuery = useCallback(
    (nlQuery: string) => {
      setActiveView("chat");
      setActiveDrawer(null);
      sendChatMessage(nlQuery);
    },
    [sendChatMessage]
  );

  return (
    <TooltipProvider delayDuration={500}>
      <div
        className="flex h-screen overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-base)" }}
      >
        <Sidebar
          activeView={activeView}
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
          {activeView === "chat" && (
            <ChatPage
              onNewChat={handleNewChat}
              messages={messages}
              isLoadingMessages={isLoadingMessages}
              isSending={isSending}
              sendChatMessage={sendChatMessage}
              loadSessions={loadSessions}
              startNewChat={startNewChat}
            />
          )}
          {activeView === "data-sources" && <DataSourcesPage />}
          {activeView === "settings" && <SettingsPage />}
        </main>

        <Toast />
      </div>
    </TooltipProvider>
  );
}
