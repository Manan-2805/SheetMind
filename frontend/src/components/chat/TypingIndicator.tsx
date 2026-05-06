export function TypingIndicator() {
  return (
    <div className="flex gap-3 py-4">
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
                backgroundColor: "var(--color-text-tertiary)",
                animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <p
          className="text-code"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Generating SQL...
        </p>
      </div>
    </div>
  );
}
