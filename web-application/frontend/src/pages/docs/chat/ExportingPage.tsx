import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents';

export default function ExportingPage() {
  return (
    <div>
      <DocH1>Exporting Data</DocH1>
      <DocP>
        SheetMind provides multiple ways to export your query results, from Excel files to chart
        images. All exports are saved to the Artifacts section for persistent access.
      </DocP>
      <DocH2>Export as Excel</DocH2>
      <DocP>
        Click the Export as Excel button in the action bar below any result table. SheetMind
        generates a <strong>.xlsx</strong> file containing the full query result (not just the
        visible rows) and saves it to your Artifacts. The file appears immediately in the Artifacts
        drawer under the Excel Exports tab.
      </DocP>
      <ImagePlaceholder label="Export as Excel — File Saved Confirmation" />
      <DocH2>Chart Builder</DocH2>
      <DocP>
        Click Export as Chart to open the chart builder modal. The chart builder supports the
        following chart types:
      </DocP>
      <DocUl>
        <DocLi>Bar chart (vertical and horizontal)</DocLi>
        <DocLi>Line chart</DocLi>
        <DocLi>Pie chart</DocLi>
        <DocLi>Doughnut chart</DocLi>
        <DocLi>Scatter plot</DocLi>
        <DocLi>Area chart</DocLi>
        <DocLi>Radar chart</DocLi>
        <DocLi>Polar area chart</DocLi>
        <DocLi>Bubble chart</DocLi>
        <DocLi>Treemap</DocLi>
      </DocUl>
      <DocP>
        Select your chart type, configure the X and Y axes by choosing columns from the result,
        customize colors, and click Generate. The chart renders instantly in a preview pane.
      </DocP>
      <ImagePlaceholder label="Chart Builder — Configuration Panel" />
      <DocH2>Saving Charts as PNG/SVG</DocH2>
      <DocP>
        Once a chart is generated, click Save as PNG or Save as SVG to export the chart image to
        Artifacts. Charts are saved with a timestamp-based filename and appear in the Artifacts
        drawer under the Charts tab.
      </DocP>
    </div>
  );
}
