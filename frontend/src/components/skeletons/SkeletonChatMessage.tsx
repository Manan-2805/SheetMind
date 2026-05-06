import { SkeletonTable } from "./SkeletonTable";
import { SkeletonText } from "./SkeletonText";

export function SkeletonChatMessage() {
  return (
    <div className="flex gap-3 py-4" aria-hidden="true">
      <div
        className="skeleton mt-0.5 h-5 w-5 shrink-0 rounded-full"
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <SkeletonText width="100%" height="13px" />
          <SkeletonText width="82%" height="13px" />
          <SkeletonText width="61%" height="13px" />
        </div>
        <SkeletonTable />
      </div>
    </div>
  );
}
