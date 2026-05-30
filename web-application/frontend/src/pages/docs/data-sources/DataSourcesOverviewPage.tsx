import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents';

export default function DataSourcesOverviewPage() {
  return (
    <div>
      <DocH1>Data Sources</DocH1>
      <DocP>
        The Data Sources page is where you manage all your uploaded Excel files. Upload new files,
        browse your library, preview sheet contents, and delete files you no longer need.
      </DocP>
      <ImagePlaceholder label="Data Sources Page — Full View" />
      <DocH2>Upload Zone</DocH2>
      <DocP>
        At the top of the page, a large drop zone accepts Excel files via drag-and-drop or the
        Browse button. Supported formats are <strong>.xlsx</strong> and <strong>.xls</strong>. Files
        are imported into the local DuckDB database immediately after upload.
      </DocP>
      <DocH2>File List</DocH2>
      <DocP>
        Below the upload zone, all uploaded files are listed as expandable cards. Each card shows
        the file name, upload timestamp, file size, and the number of sheets. Click a card to expand
        it and see individual sheet details.
      </DocP>
      <DocH2>Sheet Details</DocH2>
      <DocP>
        When you expand a file card, you see each sheet listed with its column names, data types,
        and row count. This information helps you understand the structure of your data before
        querying it.
      </DocP>
      <DocUl>
        <DocLi>
          <strong>Column name</strong> — The header from the original Excel file
        </DocLi>
        <DocLi>
          <strong>Data type</strong> — The inferred type (text, number, date, boolean)
        </DocLi>
        <DocLi>
          <strong>Row count</strong> — Total number of data rows in the sheet
        </DocLi>
      </DocUl>
    </div>
  );
}
