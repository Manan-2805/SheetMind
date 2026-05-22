import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function SavedQueriesOverviewPage() {
  return (<div>
    <DocH1>Saved Queries</DocH1>
    <DocP>Saved Queries are the backbone of SheetMind's reuse system. Save any successful query result, then re-run it from the drawer, use it to power dashboard widgets, or mark it as a favorite for quick access.</DocP>
    <ImagePlaceholder label="Saved Queries Drawer — Full View" />
    <DocH2>The Saved Queries Drawer</DocH2>
    <DocP>Access saved queries from the sidebar. The drawer opens as a right-side panel showing all your saved queries as cards, with the most recently used at the top.</DocP>
    <DocH2>Query Card Layout</DocH2>
    <DocP>Each saved query card displays:</DocP>
    <DocUl>
      <DocLi><strong>Label</strong> — The AI-generated or custom label you gave the query</DocLi>
      <DocLi><strong>Natural language question</strong> — The original question you typed</DocLi>
      <DocLi><strong>Run count</strong> — How many times the query has been executed</DocLi>
      <DocLi><strong>Last used</strong> — Timestamp of the last execution</DocLi>
      <DocLi><strong>Star toggle</strong> — Favorite/unfavorite the query</DocLi>
    </DocUl>
    <DocH2>Running a Saved Query</DocH2>
    <DocP>Click any card to run the query. Results appear in a mini result panel within the drawer. You can expand to full screen, export, or navigate to the Chat page with the query pre-filled.</DocP>
    <DocH2>Viewing the SQL</DocH2>
    <DocP>Click the View SQL button on any card to see the generated SQL query. This is useful for auditing, learning SQL, or debugging unexpected results.</DocP>
  </div>)
}
