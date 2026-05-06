import { SkeletonText } from "./SkeletonText";

const COLUMN_WIDTHS = ["25%", "15%", "20%", "15%", "25%"];

export function SkeletonRow() {
  return (
    <tr aria-hidden="true">
      {COLUMN_WIDTHS.map((w, i) => (
        <td
          key={i}
          className="px-3 py-2"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <SkeletonText width={w} height="13px" />
        </td>
      ))}
    </tr>
  );
}
