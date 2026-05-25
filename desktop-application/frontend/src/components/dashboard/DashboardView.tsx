import React, { useEffect, useState, useRef } from 'react';
import GridLayout from 'react-grid-layout';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Grid = GridLayout as any;
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ChevronLeft, Download, Edit2 } from 'lucide-react';
import html2canvas from 'html2canvas';

import type { Dashboard, WidgetResult, DashboardWidget } from '../../types/dashboard';
import { dashboardsApi } from '../../api/dashboardsApi';
import { KpiWidget } from './widgets/KpiWidget';
import { ChartWidget } from './widgets/ChartWidget';
import { TableWidget } from './widgets/TableWidget';
import { TextWidget } from './widgets/TextWidget';
import { formatDistanceToNow } from '../../utils/formatters';

interface DashboardViewProps {
  dashboardId: string;
  onBack: () => void;
  onRedesign: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ dashboardId, onBack, onRedesign }) => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [results, setResults] = useState<Record<string, WidgetResult>>({});
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await dashboardsApi.getDashboard(dashboardId);
      setDashboard(data);
      
      // Load widget data
      const refreshData = await dashboardsApi.refreshDashboard(dashboardId);
      setResults(refreshData);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardId]);

  const handleExportPNG = async () => {
    if (!dashboardRef.current || !dashboard) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#0a0a0a', // Assuming dark theme background, should be dynamic if theme supports light
        scale: 2,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `${dashboard.title.replace(/\s+/g, '_')}_${timestamp}.png`;
      a.click();
    } catch (e) {
      console.error('Failed to export PNG', e);
    }
  };

  if (loading || !dashboard) {
    return <div className="p-8 h-full w-full flex items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  const layout = JSON.parse(dashboard.layout_json || '[]');

  const renderWidget = (widget: DashboardWidget) => {
    const result = results[widget.id];
    
    switch (widget.widget_type) {
      case 'KpiWidget': return <KpiWidget widget={widget} result={result} />;
      case 'ChartWidget': return <ChartWidget widget={widget} result={result} />;
      case 'TableWidget': return <TableWidget widget={widget} result={result} />;
      case 'TextWidget': return <TextWidget widget={widget} />;
      default: return <div className="p-4">Unknown widget type: {widget.widget_type}</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-background z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">{dashboard.title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(dashboard.updated_at))}
          </div>
          <button 
            onClick={() => onRedesign(dashboard.id)}
            className="border border-border hover:bg-muted text-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors"
          >
            <Edit2 size={14} />
            <span>Redesign</span>
          </button>
          <button 
            onClick={handleExportPNG}
            className="border border-border hover:bg-muted text-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors"
          >
            <Download size={14} />
            <span>Export PNG</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6 bg-muted/20" ref={dashboardRef}>
        <Grid
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={100}
          width={1200} // This should ideally be responsive or derived from container
          isDraggable={false}
          isResizable={false}
          margin={[16, 16]}
        >
          {dashboard.widgets.map(w => (
            <div key={w.id} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
              {renderWidget(w)}
            </div>
          ))}
        </Grid>
      </div>
    </div>
  );
};
