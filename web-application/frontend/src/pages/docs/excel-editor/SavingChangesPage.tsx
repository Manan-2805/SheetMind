import { Callout, DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function SavingChangesPage() {
  return (<div>
    <DocH1>Saving Changes</DocH1>
    <DocP>When you are satisfied with your edits, save the changes back to the database. SheetMind creates an automatic backup before every save to prevent data loss.</DocP>
    <DocH2>Save Button</DocH2>
    <DocP>Click the Save button in the toolbar to commit all accepted changes to the DuckDB database. The save operation updates the stored data so that future queries reflect your edits.</DocP>
    <ImagePlaceholder label="Save Confirmation Dialog" />
    <DocH2>Automatic Backup</DocH2>
    <DocP>Before every save, SheetMind creates a snapshot of the current data state. If something goes wrong, you can restore from the backup via the Data Management settings page.</DocP>
    <DocH2>Unsaved Changes Indicator</DocH2>
    <DocP>When you have unsaved changes in the editor, a small dot appears next to the Save button and in the sidebar icon. If you navigate away from the editor with unsaved changes, a confirmation dialog asks whether you want to save or discard.</DocP>
    <DocH2>What Gets Saved</DocH2>
    <DocUl>
      <DocLi>All accepted cell value changes</DocLi>
      <DocLi>Added or deleted rows</DocLi>
      <DocLi>Column additions or renames</DocLi>
      <DocLi>Formatting changes are NOT saved to the database (visual only)</DocLi>
    </DocUl>
    <Callout type="info">Formatting like bold, colors, and alignment are display-only in the editor. They are not persisted to the database since DuckDB stores raw data, not Excel formatting.</Callout>
  </div>)
}
