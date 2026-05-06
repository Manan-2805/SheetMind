interface SkeletonCardProps {
  height?: string;
  className?: string;
}

export function SkeletonCard({ height = "120px", className = "" }: SkeletonCardProps) {
  return (
    <div
      className={`skeleton rounded-lg ${className}`}
      style={{ height, width: "100%" }}
      aria-hidden="true"
    />
  );
}
