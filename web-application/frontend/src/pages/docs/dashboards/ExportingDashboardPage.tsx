import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { DocH1, DocH2, DocP } from '@/components/docs/MDXComponents';

export default function ExportingDashboardPage() {
  return (
    <div>
      <DocH1>Exporting as PNG</DocH1>
      <DocP>
        Export any dashboard as a high-resolution PNG image for sharing, embedding in reports, or
        archiving.
      </DocP>
      <DocH2>How to Export</DocH2>
      <DocP>
        Click the Export as PNG button in the dashboard toolbar. SheetMind captures the entire
        dashboard layout including all widgets, charts, and data tables. The resulting image is
        saved to your Artifacts under the Charts tab.
      </DocP>
      <ImagePlaceholder label="Dashboard Export — PNG Result" />
      <DocH2>Export Quality</DocH2>
      <DocP>
        Dashboard PNGs are rendered at 2x resolution for crisp display on high-DPI screens. The file
        size depends on the complexity of the dashboard but typically ranges from 500 KB to 3 MB.
      </DocP>
      <DocH2>File Save Location</DocH2>
      <DocP>
        Exported PNGs are stored in the Artifacts directory and appear in the Artifacts drawer. You
        can also find them on disk in the SheetMind data directory under the artifacts folder.
      </DocP>
    </div>
  );
}
