export function SkeletonQueryCard() {
  return (
    <div
      className="rounded-xl p-4 animate-pulse flex flex-col gap-3"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="h-3.5 w-3.5 rounded-full shrink-0 mt-0.5"
          style={{ backgroundColor: "var(--color-bg-hover)" }}
        />
        <div className="flex-1 flex flex-col gap-2">
          <div
            className="h-3 rounded"
            style={{ backgroundColor: "var(--color-bg-hover)", width: "65%" }}
          />
          <div
            className="h-2.5 rounded"
            style={{ backgroundColor: "var(--color-bg-hover)", width: "90%" }}
          />
          <div
            className="h-2.5 rounded"
            style={{ backgroundColor: "var(--color-bg-hover)", width: "50%" }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div
          className="h-2.5 rounded"
          style={{ backgroundColor: "var(--color-bg-hover)", width: "28%" }}
        />
        <div
          className="h-7 w-14 rounded-lg"
          style={{ backgroundColor: "var(--color-bg-hover)" }}
        />
      </div>
    </div>
  );
}
