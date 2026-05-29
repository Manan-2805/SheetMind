import React, { useEffect, useState } from 'react';
import GridLayout from 'react-grid-layout';
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  LayoutGrid,
  Plus,
  Search,
  Trash2,
  Type,
  Wand2,
  X,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { dashboardsApi } from '../../api/dashboardsApi';
import { getSavedQueries, runSavedQuery } from '../../api/savedQueriesApi';
import { useToast } from '../../hooks/useToast';
import type { Dashboard, DashboardWidget, WidgetType, ColumnConfig, WidgetStyles } from '../../types/dashboard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Grid = GridLayout as any;
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardWizardProps {
  onCancel: () => void;
  onSaveSuccess: () => void;
  initialDashboard?: Dashboard | null;
}

const TEMPLATES = [
  {
    name: 'Sales & Revenue Hub',
    description: 'Track deals, conversion rates, and revenue trends in one high-impact executive dashboard.',
    widgets: [
      { id: 'sales-1', widget_type: 'KpiWidget', label: 'Total Sales', column_config_json: JSON.stringify({ valueColumn: 'sales', aggregation: 'SUM' }), x: 0, y: 0, w: 4, h: 2 },
      { id: 'sales-2', widget_type: 'KpiWidget', label: 'Conversion Rate', column_config_json: JSON.stringify({ valueColumn: 'conversion', aggregation: 'AVG' }), x: 4, y: 0, w: 4, h: 2 },
      { id: 'sales-3', widget_type: 'KpiWidget', label: 'AOV', column_config_json: JSON.stringify({ valueColumn: 'order_value', aggregation: 'AVG' }), x: 8, y: 0, w: 4, h: 2 },
      { id: 'sales-4', widget_type: 'ChartWidget', label: 'Sales Trends', column_config_json: JSON.stringify({ chartType: 'Line', xAxisColumn: 'date', yAxisColumn: 'sales' }), x: 0, y: 2, w: 8, h: 3 },
      { id: 'sales-5', widget_type: 'TableWidget', label: 'Top Customers', column_config_json: JSON.stringify({ selectedColumns: ['customer', 'total_purchase', 'country'] }), x: 8, y: 2, w: 4, h: 3 },
      { id: 'sales-6', widget_type: 'TextWidget', label: 'Summary Remarks', column_config_json: JSON.stringify({ textContext: 'Quarterly sales revenue increased by 15% due to higher average order value.' }), x: 0, y: 5, w: 12, h: 1.5 }
    ]
  },
  {
    name: 'Operations & Growth',
    description: 'Monitor departmental budgets, active targets, and task lists side by side.',
    widgets: [
      { id: 'ops-1', widget_type: 'KpiWidget', label: 'Total Revenue', column_config_json: JSON.stringify({ valueColumn: 'revenue', aggregation: 'SUM' }), x: 0, y: 0, w: 4, h: 3 },
      { id: 'ops-2', widget_type: 'GaugeWidget', label: 'Revenue Target', column_config_json: JSON.stringify({ progressColumn: 'revenue', targetValue: 100000 }), x: 0, y: 3, w: 4, h: 3 },
      { id: 'ops-3', widget_type: 'ChartWidget', label: 'Budgets vs Costs', column_config_json: JSON.stringify({ chartType: 'Bar', xAxisColumn: 'department', yAxisColumn: 'costs' }), x: 4, y: 0, w: 8, h: 3 },
      { id: 'ops-4', widget_type: 'TableWidget', label: 'Recent Activity Log', column_config_json: JSON.stringify({ selectedColumns: ['time', 'action', 'status'] }), x: 4, y: 3, w: 8, h: 3 }
    ]
  },
  {
    name: 'SaaS Product Metrics',
    description: 'Diving deep into subscription growth, tenure active logs, and churn rate trends.',
    widgets: [
      { id: 'saas-1', widget_type: 'KpiWidget', label: 'Total Users', column_config_json: JSON.stringify({ valueColumn: 'users', aggregation: 'SUM' }), x: 0, y: 0, w: 3, h: 2 },
      { id: 'saas-2', widget_type: 'KpiWidget', label: 'Active Users', column_config_json: JSON.stringify({ valueColumn: 'active_users', aggregation: 'MAX' }), x: 3, y: 0, w: 3, h: 2 },
      { id: 'saas-3', widget_type: 'KpiWidget', label: 'Conversions', column_config_json: JSON.stringify({ valueColumn: 'conversions', aggregation: 'SUM' }), x: 6, y: 0, w: 3, h: 2 },
      { id: 'saas-4', widget_type: 'KpiWidget', label: 'Churn Rate', column_config_json: JSON.stringify({ valueColumn: 'churn', aggregation: 'AVG' }), x: 9, y: 0, w: 3, h: 2 },
      { id: 'saas-5', widget_type: 'ChartWidget', label: 'Active User Distribution', column_config_json: JSON.stringify({ chartType: 'Scatter', xAxisColumn: 'tenure', yAxisColumn: 'usage_score' }), x: 0, y: 2, w: 8, h: 3 },
      { id: 'saas-6', widget_type: 'PlaceholderWidget', label: 'Product Section Info', column_config_json: '{}', x: 8, y: 2, w: 4, h: 3 }
    ]
  }
];

const AVAILABLE_WIDGET_TYPES: { type: WidgetType; label: string; desc: string }[] = [
  { type: 'KpiWidget', label: 'KPI Card', desc: 'Display a single key aggregated value' },
  { type: 'ChartWidget', label: 'Chart widget', desc: 'Render bar, line, and pie visualizations' },
  { type: 'TableWidget', label: 'Data Table', desc: 'Scrollable data log with column filters' },
  { type: 'TextWidget', label: 'Text Label', desc: 'Dynamic rich markdown templates' },
  { type: 'GaugeWidget', label: 'Progress Gauge', desc: 'Circular progress tracking a percentage' },
  { type: 'PlaceholderWidget', label: 'Section Header', desc: 'A decorative organizational outline block' }
];

const UnboundIllustration: React.FC<{ type: WidgetType }> = ({ type }) => {
  switch (type) {
    case 'KpiWidget':
      return (
        <svg className="w-12 h-12 text-muted-foreground/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="10" y="20" width="80" height="60" rx="8" />
          <line x1="20" y1="40" x2="50" y2="40" strokeWidth="4" />
          <circle cx="75" cy="40" r="8" />
          <line x1="20" y1="60" x2="80" y2="60" strokeWidth="6" />
        </svg>
      );
    case 'ChartWidget':
      return (
        <svg className="w-12 h-12 text-muted-foreground/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="10" y="20" width="80" height="60" rx="8" />
          <path d="M20 70 L40 45 L60 55 L80 35" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="70" r="2.5" fill="currentColor" />
          <circle cx="40" cy="45" r="2.5" fill="currentColor" />
          <circle cx="60" cy="55" r="2.5" fill="currentColor" />
          <circle cx="80" cy="35" r="2.5" fill="currentColor" />
        </svg>
      );
    case 'TableWidget':
      return (
        <svg className="w-12 h-12 text-muted-foreground/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="10" y="20" width="80" height="60" rx="8" />
          <line x1="10" y1="40" x2="90" y2="40" />
          <line x1="10" y1="60" x2="90" y2="60" />
          <line x1="36" y1="20" x2="36" y2="80" />
          <line x1="64" y1="20" x2="64" y2="80" />
        </svg>
      );
    case 'TextWidget':
      return (
        <svg className="w-12 h-12 text-muted-foreground/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="10" y="20" width="80" height="60" rx="8" />
          <line x1="20" y1="35" x2="80" y2="35" strokeDasharray="3 3" />
          <line x1="20" y1="50" x2="80" y2="50" strokeDasharray="3 3" />
          <line x1="20" y1="65" x2="50" y2="65" strokeDasharray="3 3" />
        </svg>
      );
    case 'PlaceholderWidget':
      return (
        <svg className="w-12 h-12 text-muted-foreground/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="10" y="20" width="80" height="60" rx="8" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="12" />
          <line x1="50" y1="20" x2="50" y2="80" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="10" y1="50" x2="90" y2="50" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
    case 'GaugeWidget':
      return (
        <svg className="w-12 h-12 text-muted-foreground/40" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M25 70 A 30 30 0 0 1 75 70" strokeWidth="6" strokeLinecap="round" />
          <path d="M50 70 L40 50" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="70" r="5" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
};

export const DashboardWizard: React.FC<DashboardWizardProps> = ({ onCancel, onSaveSuccess, initialDashboard }) => {
  const { addToast } = useToast();
  const [step, setStep] = useState(initialDashboard ? 2 : 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [layout, setLayout] = useState<any[]>(initialDashboard ? JSON.parse(initialDashboard.layout_json) : []);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialDashboard ? initialDashboard.widgets : []);
  const [name, setName] = useState(initialDashboard?.title || 'Untitled Dashboard');
  const [aiDescription, setAiDescription] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [widgetSearch, setWidgetSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isNamingLoading, setIsNamingLoading] = useState(false);

  const handleGenerateName = async () => {
    setIsNamingLoading(true);
    try {
      const res = await dashboardsApi.generateName({ widgets });
      if (res && res.title) {
        setName(res.title);
        addToast({
          type: 'success',
          title: 'AI Name Generated',
          description: `Suggested name: "${res.title}"`
        });
      }
    } catch (e) {
      console.error(e);
      addToast({
        type: 'error',
        title: 'Generation Failed',
        description: 'Failed to generate a dashboard name with AI.'
      });
    } finally {
      setIsNamingLoading(false);
    }
  };

  // Binding Panel Drawer
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [savedQueries, setSavedQueries] = useState<Record<string, unknown>[]>([]);
  const [queryColumns, setQueryColumns] = useState<string[]>([]);
  const [activePropertiesTab, setActivePropertiesTab] = useState<'binding' | 'layout' | 'design'>('binding');

  useEffect(() => {
    getSavedQueries().then((sq: unknown) => setSavedQueries(sq as Record<string, unknown>[])).catch(console.error);
  }, []);

  // Fetch columns dynamically when saved_query_id changes in properties panel
  const selectedWidget = widgets.find(w => w.id === selectedWidgetId);
  const selectedWidgetConfig: ColumnConfig = selectedWidget ? JSON.parse(selectedWidget.column_config_json || '{}') : {};
  const selectedWidgetQueryId = selectedWidgetConfig.comparisonQueryId || selectedWidget?.saved_query_id;

  useEffect(() => {
    if (selectedWidgetQueryId) {
      runSavedQuery(selectedWidgetQueryId, 1, 1)
        .then(res => {
          if (res?.result?.columns) {
            setQueryColumns(res.result.columns.map((c) => c.key));
          } else {
            setQueryColumns([]);
          }
        })
        .catch(() => setQueryColumns([]));
    } else {
      const timer = setTimeout(() => {
        setQueryColumns([]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedWidgetQueryId]);

  // Template select mapper
  const handleSelectTemplate = (templateWidgets: typeof TEMPLATES[0]['widgets']) => {
    const newLayout = templateWidgets.map(tw => ({
      i: tw.id,
      x: tw.x,
      y: tw.y,
      w: tw.w,
      h: tw.h
    }));
    const newWidgets = templateWidgets.map(tw => ({
      id: tw.id,
      dashboard_id: '',
      widget_type: tw.widget_type as WidgetType,
      label: tw.label,
      column_config_json: tw.column_config_json,
      position_json: JSON.stringify({ i: tw.id, x: tw.x, y: tw.y, w: tw.w, h: tw.h }),
      size: 'Medium'
    }));
    setLayout(newLayout);
    setWidgets(newWidgets);
    setStep(2);
  };

  const handleAIGenerateLayout = async () => {
    if (!aiDescription) return;
    setIsAiLoading(true);
    try {
      const res = await dashboardsApi.generateLayout({ description: aiDescription });
      const newLayout = res.widgets.map((_, index) => {
        const i = uuidv4();
        return { i, x: (index % 2) * 6, y: Math.floor(index / 2) * 4, w: 6, h: 4 };
      });
      const newWidgets = res.widgets.map((w, index) => ({
        id: newLayout[index].i,
        dashboard_id: '',
        widget_type: w.widget_type as WidgetType,
        label: String(w.label),
        column_config_json: '{}',
        position_json: JSON.stringify(newLayout[index]),
        size: 'Medium'
      }));
      setLayout(newLayout);
      setWidgets(newWidgets);
      setStep(2);
    } catch (e) {
      console.error(e);
      alert('Failed to generate layout.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const addWidget = (type: WidgetType) => {
    const id = uuidv4();
    const l = { i: id, x: 0, y: Infinity, w: 4, h: 3 };
    setLayout([...layout, l]);
    setWidgets([...widgets, {
      id,
      dashboard_id: '',
      widget_type: type,
      label: `New ${type.replace('Widget', '')}`,
      column_config_json: '{}',
      position_json: JSON.stringify(l),
      size: 'Medium'
    }]);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = (newLayout: any) => {
    setLayout(newLayout);
  };

  const saveDashboard = async () => {
    const unboundWidgets = widgets.filter(
      w => w.widget_type !== 'PlaceholderWidget' && !w.saved_query_id
    );
    if (unboundWidgets.length > 0) {
      addToast({
        type: 'error',
        title: 'Query Selection Required',
        description: `Please select a query for the following widgets: ${unboundWidgets.map(w => w.label).join(', ')}.`
      });
      return;
    }

    const data = {
      title: name,
      layout_json: JSON.stringify(layout),
      widgets: widgets.map(w => ({
        ...w,
        position_json: JSON.stringify(layout.find(l => String(l.i) === w.id) || {})
      }))
    };
    
    try {
      if (initialDashboard) {
        await dashboardsApi.updateDashboard(initialDashboard.id, data);
      } else {
        await dashboardsApi.createDashboard(data);
      }
      onSaveSuccess();
    } catch (e) {
      console.error('Failed to save dashboard', e);
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: 'An error occurred while saving the dashboard.'
      });
    }
  };

  const updateWidgetConfig = (updates: Partial<ColumnConfig>) => {
    if (!selectedWidgetId) return;
    setWidgets(prev => prev.map(w => {
      if (w.id === selectedWidgetId) {
        const currentConfig = JSON.parse(w.column_config_json || '{}');
        const updatedConfig = { ...currentConfig, ...updates };
        return {
          ...w,
          column_config_json: JSON.stringify(updatedConfig)
        };
      }
      return w;
    }));
  };

  const updateWidgetStyles = (styleUpdates: Partial<WidgetStyles>) => {
    if (!selectedWidgetId) return;
    setWidgets(prev => prev.map(w => {
      if (w.id === selectedWidgetId) {
        const currentConfig = JSON.parse(w.column_config_json || '{}');
        const currentStyles = currentConfig.styles || {};
        const updatedConfig = {
          ...currentConfig,
          styles: { ...currentStyles, ...styleUpdates }
        };
        return {
          ...w,
          column_config_json: JSON.stringify(updatedConfig)
        };
      }
      return w;
    }));
  };

  const currentStyles: WidgetStyles = selectedWidgetConfig.styles || {};

  const filteredWidgets = AVAILABLE_WIDGET_TYPES.filter(w => 
    w.label.toLowerCase().includes(widgetSearch.toLowerCase()) ||
    w.desc.toLowerCase().includes(widgetSearch.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-background relative overflow-hidden flex flex-col">
      {step === 1 && (
        <div className="flex flex-col items-center justify-center p-8 space-y-8 h-full overflow-y-auto">
          <div className="w-full max-w-4xl flex items-center justify-between">
            <button onClick={onCancel} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              <ChevronLeft size={16} className="mr-1" /> Back to List
            </button>
            <h2 className="text-xl font-bold tracking-tight">Create New Dashboard</h2>
            <div className="w-20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {TEMPLATES.map(l => (
              <div 
                key={l.name} 
                onClick={() => handleSelectTemplate(l.widgets)} 
                className="bg-card border border-border p-6 rounded-xl cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col justify-between group text-left"
              >
                <div>
                  <div className="p-3 bg-primary/5 group-hover:bg-primary/10 rounded-lg w-fit text-primary mb-4 transition-colors">
                    <LayoutGrid size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{l.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{l.description}</p>
                </div>
                <div className="text-xs text-primary font-semibold mt-4 flex items-center group-hover:translate-x-1 transition-transform">
                  <span>Use template</span>
                  <ChevronRight size={14} className="ml-1" />
                </div>
              </div>
            ))}
          </div>

          <div className="w-full max-w-4xl p-6 bg-card border border-border rounded-xl shadow-sm text-center">
            <h3 className="font-semibold text-lg mb-2">Or build customized canvas manually</h3>
            <p className="text-xs text-muted-foreground mb-4">Start with a clean sheet and drag widgets onto the designing grid.</p>
            <button 
              onClick={() => handleSelectTemplate([])}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-all inline-flex items-center"
            >
              <Plus size={16} className="mr-2" />
              <span>Blank Dashboard Canvas</span>
            </button>
          </div>

          <div className="w-full max-w-4xl pt-8 border-t border-border">
            <h3 className="text-lg font-semibold mb-4 text-center">Or describe your layout goals to AI Wizard</h3>
            <div className="flex space-x-3">
              <input 
                type="text" 
                placeholder="E.g., 3 KPI cards for Sales, conversions, AOV, and a radial target gauge"
                value={aiDescription}
                onChange={e => setAiDescription(e.target.value)}
                className="flex-1 bg-card border border-input rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              <button 
                onClick={handleAIGenerateLayout} 
                disabled={isAiLoading} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Wand2 size={16} />
                <span>{isAiLoading ? 'Generating...' : 'Generate Layout'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Draggable Widget elements sidebar */}
          <div 
            className={`border-r border-border bg-card flex flex-col transition-all duration-300 shrink-0 relative ${
              sidebarOpen ? 'w-72' : 'w-0 border-r-0'
            }`}
          >
            {sidebarOpen && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold text-sm tracking-tight">Widget Elements</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Click or drag elements to canvas</p>
                </div>
                <div className="p-3 border-b border-border bg-muted/20">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search widgets..." 
                      value={widgetSearch}
                      onChange={e => setWidgetSearch(e.target.value)}
                      className="w-full bg-background border border-input rounded pl-7 pr-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {filteredWidgets.map(w => (
                    <div 
                      key={w.type} 
                      onClick={() => addWidget(w.type)}
                      className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-all flex items-start space-x-3 group"
                    >
                      <div className="p-2 bg-primary/5 text-primary rounded group-hover:bg-primary/10 transition-colors shrink-0">
                        {w.type === 'GaugeWidget' ? <Gauge size={16} /> : w.type === 'TextWidget' ? <Type size={16} /> : <LayoutGrid size={16} />}
                      </div>
                      <div>
                        <h4 className="font-medium text-xs text-foreground">{w.label}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{w.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-card border border-border rounded-full p-0.5 z-20 shadow-md hover:bg-muted"
            >
              {sidebarOpen ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
            </button>
          </div>

          {/* Main Designing Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background shrink-0 z-10">
              <div className="flex space-x-3 items-center">
                <button onClick={() => setStep(1)} className="p-1.5 hover:bg-muted rounded-full">
                  <ChevronLeft size={16} />
                </button>
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm font-bold tracking-tight bg-transparent border-b border-transparent hover:border-border focus:border-accent outline-none py-0 px-1 w-64 transition-all rounded-sm focus:ring-1 focus:ring-accent"
                    title="Click to rename dashboard"
                  />
                  <p className="text-[10px] text-muted-foreground px-1">Grid layout drag & resize active</p>
                </div>
              </div>
              <div className="flex space-x-2 items-center">
                <button onClick={() => { setLayout([]); setWidgets([]); }} className="text-xs text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-md font-semibold transition-colors">
                  Clear Canvas
                </button>
                <span className="text-[10px] text-muted-foreground border-l border-border pl-2 mr-2">{widgets.length} elements</span>
                <button 
                  onClick={() => initialDashboard ? saveDashboard() : setStep(3)} 
                  disabled={widgets.length === 0} 
                  className="bg-accent text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:grayscale px-4 py-1.5 rounded-md text-xs font-semibold shadow-md shadow-accent/15 transition-all"
                >
                  {initialDashboard ? 'Save & Update' : 'Save & Publish →'}
                </button>
              </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-auto bg-muted/10 p-6">
              <Grid
                className="layout min-h-[500px]"
                layout={layout}
                cols={12}
                rowHeight={60}
                width={1200}
                onLayoutChange={handleLayoutChange}
                draggableHandle=".drag-handle"
                margin={[16, 16]}
              >
                {widgets.map(w => {
                  const conf: ColumnConfig = JSON.parse(w.column_config_json || '{}');
                  
                  return (
                    <div 
                      key={w.id} 
                      onClick={() => setSelectedWidgetId(w.id)}
                      className="bg-card border border-border border-dashed hover:border-solid rounded-lg shadow-sm flex flex-col group overflow-hidden relative cursor-pointer"
                    >
                      <div className="drag-handle bg-muted/60 p-2 text-[10px] font-semibold border-b border-border cursor-move flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                        <span>{w.label}</span>
                        <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => { setLayout(layout.filter(l => String(l.i) !== w.id)); setWidgets(widgets.filter(ww => ww.id !== w.id)); if (selectedWidgetId === w.id) setSelectedWidgetId(null); }}
                            className="text-muted-foreground hover:text-destructive p-0.5 rounded"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                        <UnboundIllustration type={w.widget_type} />
                        <span className="text-[10px] text-muted-foreground mt-1 truncate max-w-full">
                          {conf.valueColumn || conf.xAxisColumn || conf.progressColumn ? 'Query Bound' : 'Configure binding'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </Grid>
            </div>
          </div>

          {/* Properties Panel drawer */}
          {selectedWidgetId && selectedWidget && (
            <div className="w-[380px] border-l border-border bg-card shadow-2xl flex flex-col shrink-0 relative animate-in slide-in-from-right duration-200">
              <div className="flex justify-between items-center p-4 border-b border-border bg-muted/20">
                <div>
                  <h3 className="font-bold text-xs">Properties Panel</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{selectedWidget.label}</p>
                </div>
                <button onClick={() => setSelectedWidgetId(null)} className="p-1 hover:bg-muted rounded text-muted-foreground"><X size={14} /></button>
              </div>

              {/* Sub-Tabs */}
              <div className="flex border-b border-border text-xs shrink-0">
                <button 
                  onClick={() => setActivePropertiesTab('binding')}
                  className={`flex-1 py-2 text-center border-b-2 font-medium ${activePropertiesTab === 'binding' ? 'border-primary text-foreground bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted/30'}`}
                >
                  Binding
                </button>
                <button 
                  onClick={() => setActivePropertiesTab('layout')}
                  className={`flex-1 py-2 text-center border-b-2 font-medium ${activePropertiesTab === 'layout' ? 'border-primary text-foreground bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted/30'}`}
                >
                  Layout
                </button>
                <button 
                  onClick={() => setActivePropertiesTab('design')}
                  className={`flex-1 py-2 text-center border-b-2 font-medium ${activePropertiesTab === 'design' ? 'border-primary text-foreground bg-primary/5' : 'border-transparent text-muted-foreground hover:bg-muted/30'}`}
                >
                  Design
                </button>
              </div>

              {/* Properties Fields Panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {activePropertiesTab === 'binding' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground mb-1">Widget Title Label</label>
                      <input 
                        type="text" 
                        value={selectedWidget.label}
                        onChange={e => setWidgets(widgets.map(w => w.id === selectedWidgetId ? { ...w, label: e.target.value } : w))}
                        className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {selectedWidget.widget_type !== 'PlaceholderWidget' && (
                      <div>
                        <label className="block text-[10px] font-medium text-muted-foreground mb-1">Bind Saved Query</label>
                        <select 
                          value={selectedWidget.saved_query_id || ''}
                          onChange={e => setWidgets(widgets.map(w => w.id === selectedWidgetId ? { ...w, saved_query_id: e.target.value } : w))}
                          className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          <option value="">Select a query...</option>
                          {savedQueries.map(sq => (
                            <option key={String(sq.id)} value={String(sq.id)}>{String(sq.label)}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* KPI Widget fields */}
                    {selectedWidget.widget_type === 'KpiWidget' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Value Column</label>
                          <select 
                            value={selectedWidgetConfig.valueColumn || ''}
                            onChange={e => updateWidgetConfig({ valueColumn: e.target.value })}
                            className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none cursor-pointer"
                          >
                            <option value="">Choose Column...</option>
                            {queryColumns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Aggregation</label>
                          <select 
                            value={selectedWidgetConfig.aggregation || ''}
                            onChange={e => updateWidgetConfig({ aggregation: e.target.value })}
                            className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none cursor-pointer"
                          >
                            <option value="">Aggregation...</option>
                            <option value="SUM">SUM</option>
                            <option value="AVG">AVG</option>
                            <option value="MAX">MAX</option>
                            <option value="MIN">MIN</option>
                            <option value="COUNT">COUNT</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Chart Widget fields */}
                    {selectedWidget.widget_type === 'ChartWidget' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Chart Type</label>
                          <select 
                            value={selectedWidgetConfig.chartType || 'Bar'}
                            onChange={e => updateWidgetConfig({ chartType: e.target.value as ColumnConfig['chartType'] })}
                            className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none cursor-pointer"
                          >
                            <option value="Bar">Bar Chart</option>
                            <option value="Line">Line Chart</option>
                            <option value="Pie">Pie Chart</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">X Axis Column</label>
                          <select 
                            value={selectedWidgetConfig.xAxisColumn || ''}
                            onChange={e => updateWidgetConfig({ xAxisColumn: e.target.value })}
                            className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none cursor-pointer"
                          >
                            <option value="">Choose Column...</option>
                            {queryColumns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Y Axis Column</label>
                          <select 
                            value={selectedWidgetConfig.yAxisColumn || ''}
                            onChange={e => updateWidgetConfig({ yAxisColumn: e.target.value })}
                            className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none cursor-pointer"
                          >
                            <option value="">Choose Column...</option>
                            {queryColumns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Data Table fields */}
                    {selectedWidget.widget_type === 'TableWidget' && (
                      <div>
                        <label className="block text-[10px] font-medium text-muted-foreground mb-2">Display Columns</label>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto p-2 bg-muted/20 border border-border rounded">
                          {queryColumns.length === 0 ? (
                            <span className="text-[10px] text-muted-foreground">Select query to load columns</span>
                          ) : (
                            queryColumns.map(c => {
                              const checked = (selectedWidgetConfig.selectedColumns || []).includes(c);
                              return (
                                <label key={c} className="flex items-center space-x-2 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={checked}
                                    onChange={() => {
                                      const cols = selectedWidgetConfig.selectedColumns || [];
                                      const nextCols = checked ? cols.filter(x => x !== c) : [...cols, c];
                                      updateWidgetConfig({ selectedColumns: nextCols });
                                    }}
                                    className="rounded border-input text-primary focus:ring-primary"
                                  />
                                  <span>{c}</span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Text Label fields */}
                    {selectedWidget.widget_type === 'TextWidget' && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Template Bracket Text</label>
                          <textarea 
                            rows={4}
                            value={selectedWidgetConfig.textContext || ''}
                            onChange={e => updateWidgetConfig({ textContext: e.target.value })}
                            className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none text-xs"
                            placeholder="E.g., High sales by {customer} in {country}."
                          />
                          {queryColumns.length > 0 && (
                            <div className="mt-1">
                              <span className="text-[9px] font-semibold text-muted-foreground block uppercase tracking-wider">Available Columns:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {queryColumns.map(c => (
                                  <span 
                                    key={c} 
                                    onClick={() => {
                                      const text = selectedWidgetConfig.textContext || '';
                                      updateWidgetConfig({ textContext: text + `{${c}}` });
                                    }}
                                    className="bg-muted hover:bg-accent hover:text-accent-foreground text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                    title="Click to insert column bracket"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Target Row Index</label>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => updateWidgetConfig({ textRowIndex: 'first' })}
                              className={`py-1 text-xs font-semibold rounded border transition-colors ${(!selectedWidgetConfig.textRowIndex || selectedWidgetConfig.textRowIndex === 'first') ? 'bg-accent text-white border-accent' : 'bg-background hover:bg-muted border-input'}`}
                            >
                              First
                            </button>
                            <button
                              type="button"
                              onClick={() => updateWidgetConfig({ textRowIndex: 'last' })}
                              className={`py-1 text-xs font-semibold rounded border transition-colors ${(selectedWidgetConfig.textRowIndex === 'last') ? 'bg-accent text-white border-accent' : 'bg-background hover:bg-muted border-input'}`}
                            >
                              Last
                            </button>
                            <button
                              type="button"
                              onClick={() => updateWidgetConfig({ textRowIndex: '0' })}
                              className={`py-1 text-xs font-semibold rounded border transition-colors ${(selectedWidgetConfig.textRowIndex !== 'first' && selectedWidgetConfig.textRowIndex !== 'last' && selectedWidgetConfig.textRowIndex !== undefined) ? 'bg-accent text-white border-accent' : 'bg-background hover:bg-muted border-input'}`}
                            >
                              Custom
                            </button>
                          </div>
                          {(selectedWidgetConfig.textRowIndex !== 'first' && selectedWidgetConfig.textRowIndex !== 'last' && selectedWidgetConfig.textRowIndex !== undefined) && (
                            <input 
                              type="number" 
                              min="0"
                              value={isNaN(parseInt(selectedWidgetConfig.textRowIndex as string)) ? 0 : parseInt(selectedWidgetConfig.textRowIndex as string)}
                              onChange={e => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                updateWidgetConfig({ textRowIndex: String(val) });
                              }}
                              className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none text-xs"
                              placeholder="Row index (0-based)"
                            />
                          )}
                        </div>
                      </>
                    )}

                    {/* Progress Gauge fields */}
                    {selectedWidget.widget_type === 'GaugeWidget' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Progress Column</label>
                          <select 
                            value={selectedWidgetConfig.progressColumn || ''}
                            onChange={e => updateWidgetConfig({ progressColumn: e.target.value })}
                            className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none cursor-pointer"
                          >
                            <option value="">Choose Column...</option>
                            {queryColumns.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Custom Target Value</label>
                          <input 
                            type="number" 
                            value={selectedWidgetConfig.targetValue || 100}
                            onChange={e => updateWidgetConfig({ targetValue: Number(e.target.value) })}
                            className="w-full bg-background border border-input rounded px-3 py-1.5 outline-none"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {activePropertiesTab === 'layout' && (
                  <>
                    <div className="p-3 bg-muted/10 border border-border rounded-lg space-y-3">
                      <h4 className="font-semibold text-[10px] text-primary">Grid Position Dimensions</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Resize directly in canvas or adjust using dragging handles.
                      </p>
                    </div>

                    {(() => {
                      const currentMargin = currentStyles.margin || { top: 0, right: 0, bottom: 0, left: 0 };
                      return (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-[10px] border-b border-border pb-1">Margin overrides (px)</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-muted-foreground">Top</label>
                              <input 
                                type="number" 
                                value={currentMargin.top}
                                onChange={e => updateWidgetStyles({ margin: { ...currentMargin, top: Number(e.target.value) } })}
                                className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-muted-foreground">Right</label>
                              <input 
                                type="number" 
                                value={currentMargin.right}
                                onChange={e => updateWidgetStyles({ margin: { ...currentMargin, right: Number(e.target.value) } })}
                                className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-muted-foreground">Bottom</label>
                              <input 
                                type="number" 
                                value={currentMargin.bottom}
                                onChange={e => updateWidgetStyles({ margin: { ...currentMargin, bottom: Number(e.target.value) } })}
                                className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-muted-foreground">Left</label>
                              <input 
                                type="number" 
                                value={currentMargin.left}
                                onChange={e => updateWidgetStyles({ margin: { ...currentMargin, left: Number(e.target.value) } })}
                                className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const currentPadding = currentStyles.padding || { top: 0, right: 0, bottom: 0, left: 0 };
                      return (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-[10px] border-b border-border pb-1">Padding overrides (px)</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-muted-foreground">Top</label>
                              <input 
                                type="number" 
                                value={currentPadding.top}
                                onChange={e => updateWidgetStyles({ padding: { ...currentPadding, top: Number(e.target.value) } })}
                                className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-muted-foreground">Right</label>
                              <input 
                                type="number" 
                                value={currentPadding.right}
                                onChange={e => updateWidgetStyles({ padding: { ...currentPadding, right: Number(e.target.value) } })}
                                className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-muted-foreground">Bottom</label>
                              <input 
                                type="number" 
                                value={currentPadding.bottom}
                                onChange={e => updateWidgetStyles({ padding: { ...currentPadding, bottom: Number(e.target.value) } })}
                                className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-muted-foreground">Left</label>
                              <input 
                                type="number" 
                                value={currentPadding.left}
                                onChange={e => updateWidgetStyles({ padding: { ...currentPadding, left: Number(e.target.value) } })}
                                className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                {activePropertiesTab === 'design' && (
                  <>
                    {/* Borders */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-[10px] border-b border-border pb-1">Borders</h4>
                      <div>
                        <label className="block text-[9px] text-muted-foreground mb-0.5">Border Style</label>
                        <select 
                          value={currentStyles.borderStyle || 'none'}
                          onChange={e => updateWidgetStyles({ borderStyle: e.target.value as WidgetStyles['borderStyle'] })}
                          className="w-full bg-background border border-input rounded px-2 py-1 text-xs outline-none"
                        >
                          <option value="none">none</option>
                          <option value="solid">solid</option>
                          <option value="dashed">dashed</option>
                          <option value="dotted">dotted</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-muted-foreground">Size (px)</label>
                          <input 
                            type="number" 
                            value={currentStyles.borderWidth ?? 0}
                            onChange={e => updateWidgetStyles({ borderWidth: Number(e.target.value) })}
                            className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-muted-foreground">Radius (px)</label>
                          <input 
                            type="number" 
                            value={currentStyles.borderRadius ?? 8}
                            onChange={e => updateWidgetStyles({ borderRadius: Number(e.target.value) })}
                            className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] text-muted-foreground mb-0.5">Border Color</label>
                        <div className="flex space-x-2 items-center">
                          <input 
                            type="color" 
                            value={currentStyles.borderColor || '#333333'}
                            onChange={e => updateWidgetStyles({ borderColor: e.target.value })}
                            className="bg-transparent border-0 w-8 h-8 rounded p-0 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={currentStyles.borderColor || ''}
                            onChange={e => updateWidgetStyles({ borderColor: e.target.value })}
                            className="flex-1 bg-background border border-input rounded px-2 py-1 text-xs"
                            placeholder="#333333"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Backgrounds */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-[10px] border-b border-border pb-1">Background Details</h4>
                      <div>
                        <label className="block text-[9px] text-muted-foreground mb-0.5">Solid Color</label>
                        <div className="flex space-x-2 items-center">
                          <input 
                            type="color" 
                            value={currentStyles.backgroundColor || '#000000'}
                            onChange={e => updateWidgetStyles({ backgroundColor: e.target.value })}
                            className="bg-transparent border-0 w-8 h-8 rounded p-0 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={currentStyles.backgroundColor || ''}
                            onChange={e => updateWidgetStyles({ backgroundColor: e.target.value })}
                            className="flex-1 bg-background border border-input rounded px-2 py-1 text-xs"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] text-muted-foreground mb-0.5">Image URL</label>
                        <input 
                          type="text" 
                          value={currentStyles.backgroundImageUrl || ''}
                          onChange={e => updateWidgetStyles({ backgroundImageUrl: e.target.value })}
                          className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-muted-foreground mb-0.5">Loop Video URL</label>
                        <input 
                          type="text" 
                          value={currentStyles.backgroundVideoUrl || ''}
                          onChange={e => updateWidgetStyles({ backgroundVideoUrl: e.target.value })}
                          className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-muted-foreground">Opacity (%)</label>
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={currentStyles.backgroundOpacity ?? 100}
                            onChange={e => updateWidgetStyles({ backgroundOpacity: Number(e.target.value) })}
                            className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-muted-foreground">Blur (px)</label>
                          <input 
                            type="number" 
                            min="0" 
                            max="24" 
                            value={currentStyles.backgroundBlur ?? 0}
                            onChange={e => updateWidgetStyles({ backgroundBlur: Number(e.target.value) })}
                            className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Typography */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-[10px] border-b border-border pb-1">Typography (Text)</h4>
                      <div>
                        <label className="block text-[9px] text-muted-foreground mb-0.5">Font Family</label>
                        <select 
                          value={currentStyles.fontFamily || 'sans-serif'}
                          onChange={e => updateWidgetStyles({ fontFamily: e.target.value as WidgetStyles['fontFamily'] })}
                          className="w-full bg-background border border-input rounded px-2 py-1 text-xs outline-none"
                        >
                          <option value="sans-serif">sans-serif</option>
                          <option value="serif">serif</option>
                          <option value="monospace">monospace</option>
                          <option value="Inter">Inter</option>
                          <option value="Outfit">Outfit</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-muted-foreground">Font Size (px)</label>
                          <input 
                            type="number" 
                            value={currentStyles.fontSize ?? 14}
                            onChange={e => updateWidgetStyles({ fontSize: Number(e.target.value) })}
                            className="w-full bg-background border border-input rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-muted-foreground">Text Color</label>
                          <input 
                            type="color" 
                            value={currentStyles.textColor || '#ffffff'}
                            onChange={e => updateWidgetStyles({ textColor: e.target.value })}
                            className="bg-transparent border-0 w-8 h-8 rounded p-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Animations */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-[10px] border-b border-border pb-1">Loop Animations</h4>
                      <div>
                        <label className="block text-[9px] text-muted-foreground mb-0.5">Continuous Animation</label>
                        <select 
                          value={currentStyles.loopAnimation || 'none'}
                          onChange={e => updateWidgetStyles({ loopAnimation: e.target.value as WidgetStyles['loopAnimation'] })}
                          className="w-full bg-background border border-input rounded px-2 py-1 text-xs outline-none"
                        >
                          <option value="none">none</option>
                          <option value="fade-in">fade in</option>
                          <option value="zoom-in">zoom in</option>
                          <option value="slide-in">slide in</option>
                          <option value="pulse">pulse</option>
                          <option value="float">float</option>
                          <option value="bounce">bounce</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/20">
                <button onClick={() => setSelectedWidgetId(null)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md font-semibold text-xs transition-colors shadow-sm">
                  Confirm Settings
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-center p-8 h-full relative">
          <button onClick={() => setStep(2)} className="absolute top-6 left-6 flex items-center text-sm text-muted-foreground hover:text-foreground font-medium">
            <ChevronLeft size={16} className="mr-1" /> Back to Canvas
          </button>
          
          <div className="bg-card border border-border p-8 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 tracking-tight text-center">Name your dashboard</h2>
            
            <div className="relative mb-2">
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sales Overview Q1 2024"
                className="w-full bg-background border border-input rounded-lg pl-4 pr-12 py-2.5 text-base outline-none focus:ring-1 focus:ring-accent text-center font-medium"
              />
              <button
                type="button"
                onClick={handleGenerateName}
                disabled={isNamingLoading || widgets.length === 0}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-accent hover:bg-accent/10 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                title="Auto-generate dashboard name with AI"
              >
                {isNamingLoading ? (
                  <div className="h-4 w-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                ) : (
                  <Wand2 size={16} />
                )}
              </button>
            </div>
            
            <div className="flex space-x-3 w-full mt-6">
              <button onClick={onCancel} className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg font-semibold text-xs transition-colors">
                Cancel
              </button>
              <button onClick={saveDashboard} className="flex-1 bg-accent text-white hover:scale-[1.02] active:scale-[0.98] py-2 rounded-lg font-semibold text-xs transition-all shadow-md shadow-accent/15">
                Save Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
