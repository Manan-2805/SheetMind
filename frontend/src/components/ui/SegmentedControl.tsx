import { cn } from "@/utils/cn";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn("flex rounded-lg p-0.5", className)}
      style={{
        backgroundColor: "var(--color-bg-hover)",
        border: "1px solid var(--color-border-default)",
      }}
      role="radiogroup"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-body-em transition-colors duration-[120ms]",
              "active:scale-[0.97]"
            )}
            style={{
              backgroundColor: isActive
                ? "var(--color-bg-active)"
                : "transparent",
              color: isActive
                ? "var(--color-text-primary)"
                : "var(--color-text-secondary)",
              border: isActive
                ? "1px solid var(--color-border-default)"
                : "1px solid transparent",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
