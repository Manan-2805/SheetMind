import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents';

export default function ChangeStackPage() {
  return (
    <div>
      <DocH1>Change Stack & Diff View</DocH1>
      <DocP>
        The Change Stack tracks every modification made in the Excel Editor, whether manual or
        AI-generated. Each change can be individually reviewed, accepted, or rejected.
      </DocP>
      <ImagePlaceholder label="Change Stack Panel — Pending and Applied Changes" />
      <DocH2>Change States</DocH2>
      <DocUl>
        <DocLi>
          <strong>Pending</strong> — AI-generated changes that have been previewed but not yet
          applied. Shown with a yellow indicator.
        </DocLi>
        <DocLi>
          <strong>Accepted</strong> — Changes that have been applied to the grid. Shown with a green
          checkmark.
        </DocLi>
        <DocLi>
          <strong>Rejected</strong> — Changes that were discarded. Shown with a red cross and can be
          permanently removed from the stack.
        </DocLi>
      </DocUl>
      <DocH2>Reviewing Changes</DocH2>
      <DocP>
        Click any change in the stack to see its diff view. The diff shows the affected cells with
        old values (red, struck through) and new values (green). This helps you understand exactly
        what each change does before deciding to keep or remove it.
      </DocP>
      <DocH2>Reverting Changes</DocH2>
      <DocP>
        Click the Revert button on any accepted change to undo it. The cells return to their
        previous values and the change moves back to Pending state. This non-destructive approach
        means you can experiment freely.
      </DocP>
    </div>
  );
}
