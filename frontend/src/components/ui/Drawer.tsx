import { useEffect, useRef } from "react";

import { cn } from "@/utils/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  width?: number;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  side = "left",
  width = 280,
  children,
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const hiddenOffset = width + 52;
  const translateX =
    side === "left"
      ? `translateX(-${hiddenOffset}px)`
      : `translateX(${hiddenOffset}px)`;

  return (
    <>
      <div
        ref={drawerRef}
        className={cn("fixed top-0 z-40 flex h-full flex-col", className)}
        style={{
          width,
          [side]: 52,
          backgroundColor: "var(--color-bg-elevated)",
          borderRight:
            side === "left"
              ? "1px solid var(--color-border-default)"
              : undefined,
          borderLeft:
            side === "right"
              ? "1px solid var(--color-border-default)"
              : undefined,
          transform: open ? "translateX(0)" : translateX,
          transition: "transform 200ms ease-out",
          boxShadow: open ? "4px 0 24px rgba(0,0,0,0.3)" : "none",
        }}
        aria-hidden={!open}
      >
        {children}
      </div>
    </>
  );
}
