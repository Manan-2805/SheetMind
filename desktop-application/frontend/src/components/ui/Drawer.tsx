import { useEffect, useEffectEvent } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const closeFromKeyboard = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeFromKeyboard();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="absolute inset-0 z-30 rounded-2xl bg-black/15"
        onClick={onClose}
        aria-label={`Close ${title.toLowerCase()}`}
        tabIndex={-1}
      />
      <aside
        aria-label={title}
        className="absolute inset-y-0 left-0 z-40 flex w-72 max-w-full flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-elevated shadow-xl"
      >
        {children}
      </aside>
    </>
  );
}
