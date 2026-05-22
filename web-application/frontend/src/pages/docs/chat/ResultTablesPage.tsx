import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function ResultTablesPage() {
  return (<div>
    <DocH1>Working with Results</DocH1>
    <DocP>Query results in SheetMind are displayed as interactive tables with sorting, configurable row limits, AI-generated summaries, and a full action bar for further operations.</DocP>
    <ImagePlaceholder label="Query Result Table with Action Bar" />
    <DocH2>Sortable Columns</DocH2>
    <DocP>Click any column header to sort the result table by that column. Click again to toggle between ascending and descending order. A small arrow icon indicates the current sort direction.</DocP>
    <DocH2>Configurable Row Count</DocH2>
    <DocP>By default, SheetMind displays a limited number of rows (configured in Settings under Result Row Limit). A "Showing N of M rows" indicator tells you how many total rows the query returned versus how many are displayed.</DocP>
    <DocH2>NL Summary</DocH2>
    <DocP>Above each result table, SheetMind displays an AI-generated natural language summary describing what the results show. This helps you quickly understand the data without reading every row.</DocP>
    <DocH2>Confidence Warning</DocH2>
    <DocP>When the AI confidence score is low (1 or 2 out of 5), a warning banner appears above the results advising you to verify the query. This helps you identify cases where the generated SQL might not accurately reflect your question.</DocP>
    <DocH2>Action Bar</DocH2>
    <DocP>Below each result, the action bar provides these options:</DocP>
    <DocUl>
      <DocLi><strong>Export as Excel</strong> — Downloads the full result as a .xlsx file to Artifacts</DocLi>
      <DocLi><strong>Export as Chart</strong> — Opens the chart builder to visualize the data</DocLi>
      <DocLi><strong>Save Query</strong> — Saves the query with a label for reuse</DocLi>
      <DocLi><strong>Copy SQL</strong> — Copies the generated SQL to your clipboard</DocLi>
      <DocLi><strong>Copy Results</strong> — Copies the result table as tab-separated text</DocLi>
      <DocLi><strong>Expand</strong> — Opens the result in a full-screen modal</DocLi>
      <DocLi><strong>Regenerate</strong> — Asks the LLM to generate a new SQL query for the same question</DocLi>
    </DocUl>
  </div>)
}
