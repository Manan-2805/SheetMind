export function SkeletonChatMessage() {
  return (
    <div className="mb-6 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-full shrink-0"
          style={{ backgroundColor: "var(--color-bg-hover)" }}
        />
        <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--color-bg-hover)" }} />
      </div>
      <div className="ml-9 flex flex-col gap-2">
        <div
          className="h-3 rounded"
          style={{ backgroundColor: "var(--color-bg-hover)", width: "88%" }}
        />
        <div
          className="h-3 rounded"
          style={{ backgroundColor: "var(--color-bg-hover)", width: "72%" }}
        />
        <div
          className="h-3 rounded"
          style={{ backgroundColor: "var(--color-bg-hover)", width: "55%" }}
        />
      </div>
    </div>
  );
}
