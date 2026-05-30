import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { DocCode, DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents';

export default function FileReferencesPage() {
  return (
    <div>
      <DocH1>Using # File References</DocH1>
      <DocP>
        File references let you tell SheetMind exactly which data to query. Type{' '}
        <DocCode>#</DocCode> in the chat input to open the autocomplete dropdown, then select a file
        and sheet.
      </DocP>
      <ImagePlaceholder label="File Reference Autocomplete Dropdown" />
      <DocH2>How It Works</DocH2>
      <DocP>
        When you type <DocCode>#</DocCode>, a two-level dropdown appears. The first level shows all
        uploaded files. Selecting a file expands to show its sheets. Click a sheet to insert the
        reference into your message.
      </DocP>
      <DocH2>Keyboard Navigation</DocH2>
      <DocUl>
        <DocLi>
          Type <DocCode>#</DocCode> to open the dropdown
        </DocLi>
        <DocLi>Continue typing to filter files by name</DocLi>
        <DocLi>
          Use <strong>Arrow Up/Down</strong> to navigate the list
        </DocLi>
        <DocLi>
          Press <strong>Enter</strong> to select and expand a file, then select a sheet
        </DocLi>
        <DocLi>
          Press <strong>Escape</strong> to close the dropdown
        </DocLi>
      </DocUl>
      <DocH2>Multiple File References</DocH2>
      <DocP>
        You can reference multiple files in a single query by adding multiple <DocCode>#</DocCode>{' '}
        mentions. SheetMind will include the schemas for all referenced files in the prompt,
        enabling cross-file joins and comparisons.
      </DocP>
      <DocH2>Deleted File Behavior</DocH2>
      <DocP>
        If a referenced file has been deleted from Data Sources, the reference will appear with a
        strikethrough style. Submitting a query with a deleted file reference will result in an
        error message indicating the file is no longer available.
      </DocP>
    </div>
  );
}
