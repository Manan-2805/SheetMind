export type WidgetType =
  | 'KpiWidget'
  | 'ChartWidget'
  | 'TableWidget'
  | 'TextWidget'
  | 'PlaceholderWidget'
  | 'GaugeWidget';

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: WidgetType;
  label: string;
  saved_query_id?: string;
  column_config_json: string;
  position_json: string;
  size: string;
}

export interface Dashboard {
  id: string;
  title: string;
  layout_json: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  thumbnail_path?: string;
  widgets: DashboardWidget[];
}

export interface WidgetResult {
  data?: { columns?: Record<string, unknown>[]; rows?: Record<string, unknown>[] };
  error?: string;
}

export interface WidgetStyles {
  margin?: { top: number; right: number; bottom: number; left: number };
  padding?: { top: number; right: number; bottom: number; left: number };
  width?: string;
  height?: string;

  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: string;

  backgroundColor?: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  backgroundOpacity?: number;
  backgroundBlur?: number;

  textColor?: string;
  fontSize?: number;
  fontFamily?: 'sans-serif' | 'serif' | 'monospace' | 'Inter' | 'Outfit';

  loopAnimation?: 'none' | 'fade-in' | 'zoom-in' | 'slide-in' | 'pulse' | 'float' | 'bounce';
}

export interface ColumnConfig {
  valueColumn?: string;
  aggregation?: string;
  comparisonQueryId?: string;
  comparisonColumn?: string;
  xAxisColumn?: string;
  yAxisColumn?: string;
  chartType?: 'Bar' | 'Line' | 'Pie';
  selectedColumns?: string[];
  rowLimit?: number;
  textContext?: string;
  textRowIndex?: string; // 'first', 'last', or index
  progressColumn?: string;
  targetColumn?: string;
  targetValue?: number;
  styles?: WidgetStyles;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

