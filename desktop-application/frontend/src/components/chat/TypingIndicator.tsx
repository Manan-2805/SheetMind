interface TypingIndicatorProps {
  status?: string;
}

export function TypingIndicator({ status }: TypingIndicatorProps) {
  const labelMap: Record<string, string> = {
    gathering_files: "Gathering Excel files...",
    preparing_prompt: "Preparing context prompt...",
    generating_sql: "Generating SQL query...",
    executing_sql: "Executing SQL on database...",
    fixing_sql: "Fixing SQL query...",
    generating_summary: "Generating natural language summary...",
    generating_charts: "Generating data visualizations...",
  };

  const label = (status && labelMap[status]) || "Generating response...";

  return (
    <div className="flex gap-3 py-4 animate-in fade-in duration-300">
      <div
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
        aria-hidden="true"
      >
        S
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1" aria-label="Generating response">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: "var(--color-accent)",
                animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <p
          className="text-code font-medium animate-pulse"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
