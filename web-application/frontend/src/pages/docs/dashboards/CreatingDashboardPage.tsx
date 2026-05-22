import { DocH1, DocH2, DocLi, DocOl, DocP } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function CreatingDashboardPage() {
  return (<div>
    <DocH1>Creating a Dashboard</DocH1>
    <DocP>Create a new dashboard using the 3-step wizard. Choose a layout, bind saved queries to widgets, and customize the appearance.</DocP>
    <ImagePlaceholder label="Dashboard Creation Wizard — Step 1" />
    <DocH2>The 3-Step Wizard</DocH2>
    <DocOl>
      <DocLi><strong>Name & Layout</strong> — Enter a dashboard name and choose a layout template or create a custom layout</DocLi>
      <DocLi><strong>Bind Queries</strong> — For each widget slot in the layout, select a saved query and configure the widget type</DocLi>
      <DocLi><strong>Review & Create</strong> — Preview the dashboard and click Create to save it</DocLi>
    </DocOl>
    <DocH2>Templates vs Custom</DocH2>
    <DocP>SheetMind provides 7 pre-made layout templates covering common dashboard patterns (single KPI row, 2x2 grid, sidebar + main, etc.). For full control, choose Custom to manually place and resize widgets on the grid.</DocP>
    <DocP>There is also an AI layout option: describe your ideal dashboard in plain English and SheetMind generates a layout structure for you.</DocP>
  </div>)
}
