import { cn } from "@/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "destructive";
  className?: string;
}

const VARIANT_STYLES: Record<string, { bg: string; color: string }> = {
  default: {
    bg: "var(--color-bg-hover)",
    color: "var(--color-text-secondary)",
  },
  accent: {
    bg: "var(--color-accent-subtle)",
    color: "var(--color-accent)",
  },
  success: {
    bg: "rgba(34, 197, 94, 0.1)",
    color: "var(--color-success)",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.1)",
    color: "var(--color-warning)",
  },
  destructive: {
    bg: "rgba(239, 68, 68, 0.1)",
    color: "var(--color-destructive)",
  },
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <span
      className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-ui-label", className)}
      style={{
        backgroundColor: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.bg}`,
      }}
    >
      {children}
    </span>
  );
}
