import React, { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import GridLayout from 'react-grid-layout';
import { ChevronLeft, Download, Edit2 } from 'lucide-react';

import { dashboardsApi } from '../../api/dashboardsApi';
import { ChartWidget } from './widgets/ChartWidget';
import { GaugeWidget } from './widgets/GaugeWidget';
import { KpiWidget } from './widgets/KpiWidget';
import { PlaceholderWidget } from './widgets/PlaceholderWidget';
import { TableWidget } from './widgets/TableWidget';
import { TextWidget } from './widgets/TextWidget';
import { formatDistanceToNow } from '../../utils/formatters';
import type { Dashboard, WidgetResult, DashboardWidget, WidgetStyles, ColumnConfig } from '../../types/dashboard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Grid = GridLayout as any;
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardViewProps {
  dashboardId: string;
  onBack: () => void;
  onRedesign: (id: string) => void;
}

const getWidgetStyle = (styles?: WidgetStyles): React.CSSProperties => {
  if (!styles) return {};
  
  const styleObj: React.CSSProperties = {};
  
  if (styles.margin) {
    styleObj.marginTop = `${styles.margin.top}px`;
    styleObj.marginRight = `${styles.margin.right}px`;
    styleObj.marginBottom = `${styles.margin.bottom}px`;
    styleObj.marginLeft = `${styles.margin.left}px`;
  }
  
  if (styles.padding) {
    styleObj.paddingTop = `${styles.padding.top}px`;
    styleObj.paddingRight = `${styles.padding.right}px`;
    styleObj.paddingBottom = `${styles.padding.bottom}px`;
    styleObj.paddingLeft = `${styles.padding.left}px`;
  }
  
  if (styles.borderStyle && styles.borderStyle !== 'none') {
    styleObj.borderStyle = styles.borderStyle;
    styleObj.borderWidth = `${styles.borderWidth ?? 1}px`;
    styleObj.borderColor = styles.borderColor ?? 'var(--border)';
  } else if (styles.borderStyle === 'none') {
    styleObj.borderStyle = 'none';
  }
  
  if (styles.borderRadius !== undefined) {
    styleObj.borderRadius = `${styles.borderRadius}px`;
  }
  
  if (styles.backgroundColor) {
    styleObj.backgroundColor = styles.backgroundColor;
  }
  
  if (styles.backgroundImageUrl) {
    styleObj.backgroundImage = `url(${styles.backgroundImageUrl})`;
    styleObj.backgroundSize = 'cover';
    styleObj.backgroundPosition = 'center';
  }
  
  if (styles.backgroundOpacity !== undefined) {
    styleObj.opacity = styles.backgroundOpacity / 100;
  }
  
  if (styles.backgroundBlur !== undefined && styles.backgroundBlur > 0) {
    styleObj.backdropFilter = `blur(${styles.backgroundBlur}px)`;
    styleObj.WebkitBackdropFilter = `blur(${styles.backgroundBlur}px)`;
  }
  
  if (styles.textColor) {
    styleObj.color = styles.textColor;
  }
  if (styles.fontSize) {
    styleObj.fontSize = `${styles.fontSize}px`;
  }
  if (styles.fontFamily) {
    styleObj.fontFamily = styles.fontFamily;
  }
  
  return styleObj;
};

const getWidgetAnimationClass = (styles?: WidgetStyles): string => {
  if (!styles || !styles.loopAnimation) return '';
  switch (styles.loopAnimation) {
    case 'pulse': return 'anim-pulse-slow';
    case 'float': return 'anim-float-slow';
    case 'bounce': return 'anim-bounce-slow';
    case 'fade-in': return 'anim-fade-in-pulse';
    case 'zoom-in': return 'anim-zoom-in-slow';
    case 'slide-in': return 'anim-slide-in-slow';
    default: return '';
  }
};

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
      
      const refreshData = await dashboardsApi.refreshDashboard(dashboardId);
      setResults(refreshData);
    } catch (e) {
      console.error('Failed to load dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard();
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardId]);

  const handleExportPNG = async () => {
    if (!dashboardRef.current || !dashboard) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#0a0a0a',
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
  const staticLayout = React.useMemo(() => {
    return layout.map((item: any) => ({ ...item, static: true }));
  }, [layout]);

  const renderWidget = (widget: DashboardWidget) => {
    const result = results[widget.id];
    
    switch (widget.widget_type) {
      case 'KpiWidget': return <KpiWidget widget={widget} result={result} />;
      case 'ChartWidget': return <ChartWidget widget={widget} result={result} />;
      case 'TableWidget': return <TableWidget widget={widget} result={result} />;
      case 'TextWidget': return <TextWidget widget={widget} result={result} />;
      case 'PlaceholderWidget': return <PlaceholderWidget widget={widget} />;
      case 'GaugeWidget': return <GaugeWidget widget={widget} result={result} />;
      default: return <div className="p-4">Unknown widget type: {widget.widget_type}</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(0.97); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: translateY(6px); animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
        @keyframes fade-in-pulse {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes zoom-in-slow {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-in-slow {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }

        .anim-pulse-slow {
          animation: pulse-slow 3s infinite ease-in-out;
        }
        .anim-float-slow {
          animation: float-slow 4s infinite ease-in-out;
        }
        .anim-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
        .anim-fade-in-pulse {
          animation: fade-in-pulse 1s ease-out forwards;
        }
        .anim-zoom-in-slow {
          animation: zoom-in-slow 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-slide-in-slow {
          animation: slide-in-slow 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

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
          layout={staticLayout}
          cols={12}
          rowHeight={60}
          width={1200}
          isDraggable={false}
          isResizable={false}
          compactType="vertical"
          margin={[16, 16]}
        >
          {dashboard.widgets.map(w => {
            const config: ColumnConfig = JSON.parse(w.column_config_json || '{}');
            const styles = config.styles;
            const style = getWidgetStyle(styles);
            const animClass = getWidgetAnimationClass(styles);

            return (
              <div 
                key={w.id} 
                className={`bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col relative ${animClass}`}
                style={style}
              >
                {styles?.backgroundVideoUrl && (
                  <video
                    src={styles.backgroundVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-40"
                  />
                )}
                <div className="relative z-10 w-full h-full flex flex-col">
                  {renderWidget(w)}
                </div>
              </div>
            );
          })}
        </Grid>
      </div>
    </div>
  );
};

