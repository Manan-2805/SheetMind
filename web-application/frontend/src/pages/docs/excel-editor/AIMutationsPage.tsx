import { Callout, DocCode, DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function AIMutationsPage() {
  return (<div>
    <DocH1>AI Mutations</DocH1>
    <DocP>AI Mutations let you describe data changes in plain English. SheetMind generates the exact cell changes, shows you a diff preview, and lets you accept or reject before applying.</DocP>
    <ImagePlaceholder label="AI Mutation Panel — Prompt and Diff View" />
    <DocH2>The Prompt Bar</DocH2>
    <DocP>The AI Mutation panel appears below the toolbar. Type your change description in the prompt bar and press Enter or click Generate. Example prompts:</DocP>
    <DocUl>
      <DocLi><DocCode>Increase column D by 10% where column E is less than 50</DocCode></DocLi>
      <DocLi><DocCode>Format all dates in column B to MM/DD/YYYY</DocCode></DocLi>
      <DocLi><DocCode>Fill empty cells in column C with "N/A"</DocCode></DocLi>
      <DocLi><DocCode>Remove all rows where Status is "Cancelled"</DocCode></DocLi>
    </DocUl>
    <DocH2>Four Mutation Types</DocH2>
    <DocUl>
      <DocLi><strong>Cell updates</strong> — Change values in specific cells based on conditions</DocLi>
      <DocLi><strong>Row operations</strong> — Add, remove, or reorder rows</DocLi>
      <DocLi><strong>Column operations</strong> — Add derived columns, rename, or reorder</DocLi>
      <DocLi><strong>Formatting</strong> — Apply number formats, date formats, or text transformations</DocLi>
    </DocUl>
    <DocH2>Dry-Run Preview</DocH2>
    <DocP>Before any changes are applied, SheetMind shows a diff view highlighting exactly which cells will change. Changed cells are highlighted in yellow with the old value struck through and the new value shown below. This dry-run approach ensures you always know what will change before committing.</DocP>
    <ImagePlaceholder label="Diff Preview — Changed Cells Highlighted" />
    <DocH2>Accepting Changes</DocH2>
    <DocP>After reviewing the diff, click Accept to apply the changes or Reject to discard them. Accepted changes appear in the Change Stack and can still be individually reverted.</DocP>
    <Callout type="tip">Be specific in your mutation prompts. Include column names, conditions, and exact values for the best results.</Callout>
  </div>)
}
