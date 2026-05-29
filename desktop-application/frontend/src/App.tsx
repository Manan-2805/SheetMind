import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Toast } from "@/components/ui/Toast";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { OnboardingPage } from "@/pages/OnboardingPage";

export default function App() {
  const [username, setUsername] = useState<string | null>(() =>
    localStorage.getItem("sheetmind-username")
  );

  const handleOnboardingComplete = (name: string) => {
    setUsername(name);
  };

  return (
    <ToastProvider>
      {username ? (
        <AppShell />
      ) : (
        <>
          <OnboardingPage onComplete={handleOnboardingComplete} />
          <Toast />
        </>
      )}
    </ToastProvider>
  );
}
