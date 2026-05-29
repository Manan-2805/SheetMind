export function SkeletonArtifactCard() {
  return (
    <div
      className="rounded-xl p-4 animate-pulse flex flex-col gap-3"
      style={{
        backgroundColor: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-default)",
      }}
    >
      <div
        className="rounded-lg"
        style={{ height: 120, backgroundColor: "var(--color-bg-hover)" }}
      />
      <div className="flex flex-col gap-2 mt-1">
        <div
          className="h-3 rounded"
          style={{ backgroundColor: "var(--color-bg-hover)", width: "70%" }}
        />
        <div
          className="h-3 rounded"
          style={{ backgroundColor: "var(--color-bg-hover)", width: "45%" }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <div
          className="h-2.5 rounded"
          style={{ backgroundColor: "var(--color-bg-hover)", width: "30%" }}
        />
        <div className="h-6 w-16 rounded-lg" style={{ backgroundColor: "var(--color-bg-hover)" }} />
      </div>
    </div>
  );
}
