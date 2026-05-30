import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents';

export default function LayoutPickerPage() {
  return (
    <div>
      <DocH1>Layout Picker</DocH1>
      <DocP>
        The Layout Picker provides 8 layout options for your dashboard, including 7 preset templates
        and 1 AI-generated option.
      </DocP>
      <ImagePlaceholder label="Layout Picker — All 8 Options" />
      <DocH2>Available Layouts</DocH2>
      <DocUl>
        <DocLi>
          <strong>Single Column</strong> — Full-width widgets stacked vertically
        </DocLi>
        <DocLi>
          <strong>Two Column</strong> — Two equal-width columns side by side
        </DocLi>
        <DocLi>
          <strong>2x2 Grid</strong> — Four equal quadrants
        </DocLi>
        <DocLi>
          <strong>KPI Row + Main</strong> — Row of KPI cards at top, large chart below
        </DocLi>
        <DocLi>
          <strong>Sidebar + Main</strong> — Narrow sidebar with KPIs, wide main area
        </DocLi>
        <DocLi>
          <strong>Three Column</strong> — Three equal columns
        </DocLi>
        <DocLi>
          <strong>Magazine</strong> — Mixed sizes: large featured widget with smaller supporting
          widgets
        </DocLi>
        <DocLi>
          <strong>AI Generated</strong> — Describe your dashboard and SheetMind creates the layout
        </DocLi>
      </DocUl>
      <DocH2>Custom Layouts</DocH2>
      <DocP>
        After selecting any template, you can resize and rearrange widgets by dragging. Widget
        positions snap to a 12-column grid for consistent alignment.
      </DocP>
    </div>
  );
}
