import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { Callout, DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents';

export default function DataManagementPage() {
  return (
    <div>
      <DocH1>Data Management</DocH1>
      <DocP>
        The Data Management section lets you view storage usage, clear specific data categories, and
        perform dangerous operations like account deletion — all with safety controls.
      </DocP>
      <ImagePlaceholder label="Settings — Data Management Panel" />
      <DocH2>Storage Overview</DocH2>
      <DocP>
        At the top of the Data Management page, a storage breakdown shows how much disk space is
        used by each category: uploaded files (DuckDB), chat history, saved queries, artifacts, and
        settings.
      </DocP>
      <DocH2>Clear Operations</DocH2>
      <DocP>
        Each data category has its own Clear button. Clearing a category removes only that specific
        data:
      </DocP>
      <DocUl>
        <DocLi>
          <strong>Clear Chat History</strong> — Removes all conversation messages but keeps saved
          queries
        </DocLi>
        <DocLi>
          <strong>Clear Artifacts</strong> — Deletes all exported Excel files and chart images
        </DocLi>
        <DocLi>
          <strong>Clear All Data</strong> — Removes uploaded files, chat history, saved queries,
          dashboards, and artifacts
        </DocLi>
      </DocUl>
      <DocH2>Countdown Confirmation</DocH2>
      <DocP>
        Destructive operations require a countdown confirmation. When you click a Clear or Delete
        button, a countdown dialog appears (5 seconds) that you must wait through before confirming.
        This prevents accidental data loss from rapid clicking.
      </DocP>
      <DocH2>Delete Account</DocH2>
      <DocP>
        At the bottom of Data Management, the Delete Account button removes your entire local user
        profile, including all data, settings, and preferences. This operation has a 10-second
        countdown and is irreversible.
      </DocP>
      <Callout type="warning">
        Deleted data cannot be recovered. Always verify you have any important exports saved outside
        SheetMind before performing destructive operations.
      </Callout>
    </div>
  );
}
