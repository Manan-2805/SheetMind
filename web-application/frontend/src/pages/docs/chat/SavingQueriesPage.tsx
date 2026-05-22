import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function SavingQueriesPage() {
  return (<div>
    <DocH1>Saving Queries</DocH1>
    <DocP>Save any successful query result for later reuse. Saved queries are the foundation of the dashboard system and can be re-run at any time from the Saved Queries drawer.</DocP>
    <DocH2>Save Dialog</DocH2>
    <DocP>When you click the Save button in the action bar, a dialog appears with an AI-generated label for your query. The label is a short, human-readable description of what the query does. You can edit this label before saving.</DocP>
    <ImagePlaceholder label="Save Query Dialog with AI-Generated Label" />
    <DocH2>AI Label Generation</DocH2>
    <DocP>SheetMind uses the same LLM provider to generate a descriptive label based on your natural language question and the SQL query. Labels are typically 3-8 words, for example: "Top 5 Products by Revenue" or "Monthly Sales Trend Q4 2024".</DocP>
    <DocH2>Saved Queries Drawer</DocH2>
    <DocP>Open the Saved Queries drawer from the sidebar to see all your saved queries. Each card shows:</DocP>
    <DocUl>
      <DocLi>The query label</DocLi>
      <DocLi>The original natural language question</DocLi>
      <DocLi>Number of times the query has been run</DocLi>
      <DocLi>Last used timestamp</DocLi>
      <DocLi>A small result preview showing the first few rows</DocLi>
    </DocUl>
    <DocH2>Running a Saved Query</DocH2>
    <DocP>Click any saved query card to re-run it. SheetMind executes the stored SQL against the current database state, so results reflect the latest data. The result appears in a mini modal within the drawer.</DocP>
  </div>)
}
