import { Database, Sparkles, TrendingUp } from "lucide-react";

interface ChatEmptyStateProps {
  onSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  {
    icon: TrendingUp,
    text: "Show me total revenue by region for Q1 2024",
  },
  {
    icon: Database,
    text: "List all products with inventory below reorder point",
  },
  {
    icon: Sparkles,
    text: "Calculate monthly growth rate for the past 12 months",
  },
];

export function ChatEmptyState({ onSuggestion }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <img
        src="/favicon.png"
        alt="SheetMind"
        className="mb-4 h-12 w-12 shrink-0 rounded-sm object-contain shadow-sm"
        aria-hidden="true"
      />
      <h1
        className="text-page-heading mb-1 text-center"
        style={{ color: "var(--color-text-primary)" }}
      >
        SheetMind
      </h1>
      <p
        className="text-body mb-10 text-center"
        style={{ color: "var(--color-text-secondary)", maxWidth: 420 }}
      >
        Ask questions about your Excel data in plain English. Query, visualize, and export results
        instantly.
      </p>

      <div className="flex w-full max-w-lg flex-col gap-2">
        {SUGGESTIONS.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onSuggestion(text)}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-body transition-all duration-[120ms] active:scale-[0.97]"
            style={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--color-bg-hover)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--color-accent-border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--color-bg-elevated)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--color-border-default)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
            }}
          >
            <Icon size={16} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
