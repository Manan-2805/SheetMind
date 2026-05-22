import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents'
import ImagePlaceholder from '@/components/docs/ImagePlaceholder'

export default function ChartsPage() {
  return (<div>
    <DocH1>Chart Exports</DocH1>
    <DocP>Charts generated from the Chart Builder are saved as high-resolution images in the Artifacts Charts tab. View, download, or delete chart artifacts at any time.</DocP>
    <ImagePlaceholder label="Artifacts — Charts Tab with Preview" />
    <DocH2>Chart Grid</DocH2>
    <DocP>The Charts tab displays all chart artifacts in a grid layout. Each card shows a thumbnail preview of the chart, the filename, chart type, and creation timestamp.</DocP>
    <DocH2>Preview</DocH2>
    <DocP>Click any chart card to open a full-resolution preview modal. The preview displays the chart at its original render size with a dark background for optimal viewing.</DocP>
    <DocH2>Download</DocH2>
    <DocP>From the preview modal, click the Download button to save the chart file to your Downloads folder. Charts are available in the format they were originally exported (PNG or SVG).</DocP>
    <DocH2>Managing Charts</DocH2>
    <DocUl>
      <DocLi><strong>Delete</strong> — Remove a chart from artifacts permanently</DocLi>
      <DocLi><strong>Open in Explorer</strong> — Navigate to the chart file on your local filesystem</DocLi>
    </DocUl>
  </div>)
}
