interface SkeletonTextProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonText({
  width = "100%",
  height = "14px",
  className = "",
}: SkeletonTextProps) {
  return <div className={`skeleton ${className}`} style={{ width, height }} aria-hidden="true" />;
}
