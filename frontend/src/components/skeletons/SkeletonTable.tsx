import { SkeletonRow } from "./SkeletonRow";
import { SkeletonText } from "./SkeletonText";

const HEADER_WIDTHS = ["25%", "15%", "20%", "15%", "25%"];

export function SkeletonTable() {
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ border: "1px solid var(--color-border-default)" }}
      aria-hidden="true"
    >
      <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--color-bg-hover)" }}>
            {HEADER_WIDTHS.map((w, i) => (
              <th key={i} className="px-3 py-2 text-left" style={{ width: w }}>
                <SkeletonText width="70%" height="11px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
