import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function DashboardsOverviewPage() {
  return (<div>
    <DocH1>Dashboards</DocH1>
    <DocP>Dashboards in SheetMind are visual layouts powered by your saved queries. Each widget runs its bound query fresh every time the dashboard opens, so data is always current.</DocP>
    <ImagePlaceholder label="Dashboard Page — Sample Dashboard with Widgets" />
    <DocH2>Dashboard List</DocH2>
    <DocP>The main Dashboards page shows all your dashboards as cards. Each card displays the dashboard name, creation date, and number of widgets. Click a card to open the dashboard editor.</DocP>
    <DocH2>Four Widget Types</DocH2>
    <DocUl>
      <DocLi><strong>KPI Card</strong> — Displays a single numeric value with a label, ideal for totals, averages, or counts</DocLi>
      <DocLi><strong>Chart</strong> — Renders a chart (bar, line, pie, etc.) from the bound query results</DocLi>
      <DocLi><strong>Data Table</strong> — Shows the full query result in a compact, scrollable table</DocLi>
      <DocLi><strong>Text Label</strong> — Static text for titles, descriptions, or annotations</DocLi>
    </DocUl>
  </div>)
}
