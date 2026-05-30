import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import {
  Callout,
  DocCode,
  DocH1,
  DocH2,
  DocLi,
  DocOl,
  DocP,
} from '@/components/docs/MDXComponents';

export default function QuickStartPage() {
  return (
    <div>
      <DocH1>Quick Start Guide</DocH1>
      <DocP>
        This guide walks you through your first complete workflow in SheetMind: uploading a file,
        asking a question, reading the results, and saving the query for later reuse.
      </DocP>

      <Callout type="info">
        Before starting, make sure you have configured an LLM provider in Settings. See the First
        Launch & Setup page for instructions.
      </Callout>

      <DocH2>Step 1: Upload a File</DocH2>
      <DocP>
        Navigate to the Data Sources page from the sidebar. Drag and drop your{' '}
        <DocCode>.xlsx</DocCode> or
        <DocCode>.xls</DocCode> file into the upload zone, or click Browse to select a file.
        SheetMind will import the file into its local DuckDB database. You will see a progress bar
        during import.
      </DocP>
      <ImagePlaceholder label="Data Sources — File Upload Zone" />

      <DocH2>Step 2: Ask Your First Question</DocH2>
      <DocP>
        Navigate to the Chat page. In the message input, type <DocCode>#</DocCode> to open the file
        reference autocomplete. Select your uploaded file and sheet. Then type your question in
        plain English, for example:
      </DocP>
      <DocP>
        <DocCode>#SalesData.Sheet1 What are the top 5 products by total revenue?</DocCode>
      </DocP>
      <ImagePlaceholder label="Chat — Typing a Query with File Reference" />

      <DocH2>Step 3: Read the Result</DocH2>
      <DocP>
        SheetMind sends your question to the configured LLM, which generates a SQL query. The query
        is executed against your data, and results appear as a sortable table. Above the table, you
        will see an AI-generated natural language summary of the results. Below, the action bar
        provides options to export, chart, or save the query.
      </DocP>
      <ImagePlaceholder label="Chat — Query Result with Summary and Action Bar" />

      <DocH2>Step 4: Save the Query</DocH2>
      <DocP>
        Click the Save button in the action bar. A dialog appears with an AI-generated label for
        your query. You can edit the label if you prefer a different name. Click Confirm to save.
        The query is now available in the Saved Queries drawer for future reuse.
      </DocP>
      <ImagePlaceholder label="Save Query Dialog" />

      <DocH2>Step 5: View in Saved Queries</DocH2>
      <DocP>
        Open the Saved Queries drawer from the sidebar. You will see your saved query with its
        label, the original natural language text, usage count, and last used timestamp. Click the
        query card to run it again instantly and see the latest results.
      </DocP>
      <ImagePlaceholder label="Saved Queries Drawer" />

      <DocH2>Next Steps</DocH2>
      <DocOl>
        <DocLi>Try exporting a result as an Excel file or chart</DocLi>
        <DocLi>Open an uploaded file in the Excel Editor</DocLi>
        <DocLi>Create a dashboard powered by your saved queries</DocLi>
        <DocLi>Explore the Debug Info panel to understand query confidence</DocLi>
      </DocOl>
    </div>
  );
}
