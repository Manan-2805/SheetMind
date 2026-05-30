import ImagePlaceholder from '@/components/docs/ImagePlaceholder';
import { DocH1, DocH2, DocLi, DocP, DocUl } from '@/components/docs/MDXComponents';

export default function BindingQueriesPage() {
  return (
    <div>
      <DocH1>Binding Saved Queries</DocH1>
      <DocP>
        Each dashboard widget is powered by a saved query. The binding panel lets you select which
        query drives each widget and configure how the data is displayed.
      </DocP>
      <ImagePlaceholder label="Query Binding Panel — Widget Configuration" />
      <DocH2>Binding a Query to a Widget</DocH2>
      <DocP>
        Click any widget placeholder in the dashboard editor. The binding panel slides open showing
        your list of saved queries. Select a query to bind it to the widget. The widget immediately
        renders with the query results.
      </DocP>
      <DocH2>Testing the Binding</DocH2>
      <DocP>
        Click the Test button to re-run the bound query and verify the results match your
        expectations. This is useful when your underlying data has changed since the query was last
        run.
      </DocP>
      <DocH2>Column Configuration</DocH2>
      <DocP>
        For chart and data table widgets, you can configure which columns from the query result are
        used:
      </DocP>
      <DocUl>
        <DocLi>
          <strong>Chart X-axis</strong> — Select the column for the horizontal axis
        </DocLi>
        <DocLi>
          <strong>Chart Y-axis</strong> — Select one or more columns for the vertical axis (supports
          multi-series)
        </DocLi>
        <DocLi>
          <strong>KPI Value Column</strong> — Select which column's first row to display as the KPI
          value
        </DocLi>
        <DocLi>
          <strong>Table Visible Columns</strong> — Choose which columns to show or hide
        </DocLi>
      </DocUl>
    </div>
  );
}
