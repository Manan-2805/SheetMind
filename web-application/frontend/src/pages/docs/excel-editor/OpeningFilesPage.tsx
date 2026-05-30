import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { DocH1, DocH2, DocP } from '@/components/docs/MDXComponents';

export default function OpeningFilesPage() {
  return (
    <div>
      <DocH1>Opening Files</DocH1>
      <DocP>
        The Excel Editor opens files from your Data Sources library. Use the file selector dropdown
        at the top of the editor to choose which file and sheet to edit.
      </DocP>
      <DocH2>File Selector</DocH2>
      <DocP>
        Click the file selector dropdown to see all uploaded files. Select a file to see its sheets,
        then select a sheet to load it into the editor grid. The sheet data loads from the DuckDB
        database, not the original file.
      </DocP>
      <ImagePlaceholder label="File Selector Dropdown in Excel Editor" />
      <DocH2>Loading Behavior</DocH2>
      <DocP>
        When you select a sheet, the editor loads all rows and columns into a Handsontable grid. A
        loading indicator appears while data is being fetched. The grid supports smooth scrolling
        through large datasets.
      </DocP>
      <DocH2>Large File Warning</DocH2>
      <DocP>
        For sheets with more than 50,000 rows, a warning dialog appears advising that performance
        may be affected. You can choose to load the full dataset or limit to the first 50,000 rows
        for editing.
      </DocP>
    </div>
  );
}
