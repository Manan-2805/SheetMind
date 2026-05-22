import { ToastContext, useToastState } from "@/hooks/useToast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const value = useToastState();
  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}
