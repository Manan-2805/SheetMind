import { Callout, DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function ManagingFilesPage() {
  return (<div>
    <DocH1>Managing Files</DocH1>
    <DocP>The Data Sources page provides tools to browse, search, preview, and delete your uploaded files.</DocP>
    <DocH2>Expanding Sheets</DocH2>
    <DocP>Click any file card to expand it and see all sheets within the file. Each sheet shows its column names, inferred data types, and row count. Click a sheet row to see a preview of the first 10 rows of data.</DocP>
    <ImagePlaceholder label="Expanded File Card Showing Sheet Details" />
    <DocH2>Data Preview</DocH2>
    <DocP>When you click a sheet name, a preview table appears showing the first 10 rows. This lets you quickly verify that the data was imported correctly without navigating to the Chat page.</DocP>
    <DocH2>Searching Files</DocH2>
    <DocP>Use the search bar at the top of the file list to filter files by name. The search is case-insensitive and matches partial file names as you type.</DocP>
    <DocH2>Deleting Files</DocH2>
    <DocP>Click the delete icon on any file card to remove it from SheetMind. A confirmation dialog appears before deletion. Deleting a file:</DocP>
    <DocUl>
      <DocLi>Removes the file from the Data Sources list</DocLi>
      <DocLi>Drops the associated tables from the DuckDB database</DocLi>
      <DocLi>Does NOT delete saved queries that referenced this file (they will show errors if re-run)</DocLi>
      <DocLi>Does NOT affect your original file on disk</DocLi>
    </DocUl>
    <Callout type="warning">Deleting a file is permanent within SheetMind. You can re-upload the file, but the previous chat history referencing it will no longer produce results.</Callout>
  </div>)
}
