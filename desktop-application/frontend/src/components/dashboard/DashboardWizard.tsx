import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Grid = GridLayout as any;
import { v4 as uuidv4 } from 'uuid';
import { ChevronLeft, Wand2, X } from 'lucide-react';
import type { Dashboard, DashboardWidget, WidgetType } from '../../types/dashboard';
import { dashboardsApi } from '../../api/dashboardsApi';
import { getSavedQueries } from '../../api/savedQueriesApi';

interface DashboardWizardProps {
  onCancel: () => void;
  onSaveSuccess: () => void;
  initialDashboard?: Dashboard | null;
}

const LAYOUTS = [
  { name: '2 KPI Cards', layout: [{ i: '1', x: 0, y: 0, w: 6, h: 2, widget_type: 'KpiWidget' }, { i: '2', x: 6, y: 0, w: 6, h: 2, widget_type: 'KpiWidget' }] },
  { name: '4 KPI Cards', layout: [{ i: '1', x: 0, y: 0, w: 3, h: 2, widget_type: 'KpiWidget' }, { i: '2', x: 3, y: 0, w: 3, h: 2, widget_type: 'KpiWidget' }, { i: '3', x: 6, y: 0, w: 3, h: 2, widget_type: 'KpiWidget' }, { i: '4', x: 9, y: 0, w: 3, h: 2, widget_type: 'KpiWidget' }] },
  { name: 'Custom — Manual', layout: [] }
];

export const DashboardWizard: React.FC<DashboardWizardProps> = ({ onCancel, onSaveSuccess, initialDashboard }) => {
  const [step, setStep] = useState(initialDashboard ? 2 : 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [layout, setLayout] = useState<any[]>(initialDashboard ? JSON.parse(initialDashboard.layout_json) : []);
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialDashboard ? initialDashboard.widgets : []);
  const [name, setName] = useState(initialDashboard?.title || 'Untitled Dashboard');
  const [aiDescription, setAiDescription] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Binding Panel State
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [savedQueries, setSavedQueries] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    getSavedQueries().then((sq: unknown) => setSavedQueries(sq as Record<string, unknown>[])).catch(console.error);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectLayout = (layoutTemplate: any[]) => {
    const newWidgets = layoutTemplate.map(l => ({
      id: String(l.i),
      dashboard_id: '',
      widget_type: l.widget_type as WidgetType,
      label: `New ${String(l.widget_type)}`,
      column_config_json: '{}',
      position_json: JSON.stringify(l),
      size: 'Medium'
    }));
    setLayout(layoutTemplate);
    setWidgets(newWidgets);
    setStep(2);
  };

  const handleAIGenerateLayout = async () => {
    if (!aiDescription) return;
    setIsAiLoading(true);
    try {
      const res = await dashboardsApi.generateLayout({ description: aiDescription });
      const newLayout = res.widgets.map((w, index) => {
        const i = uuidv4();
        return { i, x: (index % 2) * 6, y: Math.floor(index / 2) * 4, w: 6, h: 4, widget_type: w.widget_type };
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
    const l = { i: id, x: 0, y: Infinity, w: 6, h: 4 }; // Infinity puts it at bottom
    setLayout([...layout, l]);
    setWidgets([...widgets, {
      id, dashboard_id: '', widget_type: type, label: `New ${type}`, column_config_json: '{}', position_json: JSON.stringify(l), size: 'Medium'
    }]);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLayoutChange = (newLayout: any) => {
    setLayout(newLayout);
  };

  const saveDashboard = async () => {
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
      alert('Failed to save dashboard');
    }
  };

  const renderStep1 = () => (
    <div className="flex flex-col items-center justify-center p-8 space-y-8 h-full">
      <h2 className="text-3xl font-bold">Choose a starting layout</h2>
      <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
        {LAYOUTS.map(l => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <div key={l.name} onClick={() => handleSelectLayout(l.layout as any[])} className="bg-card border border-border p-6 rounded-lg cursor-pointer hover:border-violet-500 transition-colors text-center shadow-sm">
            <h3 className="font-semibold">{l.name}</h3>
          </div>
        ))}
      </div>
      <div className="w-full max-w-4xl pt-8 border-t border-border">
        <h3 className="text-xl font-semibold mb-4">Or describe your dashboard to the AI</h3>
        <div className="flex space-x-4">
          <input 
            type="text" 
            placeholder="E.g., 2 KPI cards for Revenue and Users, and a bar chart for sales."
            value={aiDescription}
            onChange={e => setAiDescription(e.target.value)}
            className="flex-1 bg-muted rounded-md px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button onClick={handleAIGenerateLayout} disabled={isAiLoading} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md font-medium flex items-center space-x-2">
            <Wand2 size={18} />
            <span>{isAiLoading ? 'Generating...' : 'Generate Layout'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="flex items-center justify-between p-4 border-b border-border bg-background shrink-0 z-20">
        <div className="flex space-x-4 items-center">
          <button onClick={() => setStep(1)} className="p-2 hover:bg-muted rounded-full">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">Canvas Editor</h2>
        </div>
        <div className="flex space-x-4 items-center">
          <select 
            onChange={(e) => addWidget(e.target.value as WidgetType)}
            className="bg-muted border border-border rounded-md px-3 py-1.5 outline-none text-sm cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>+ Add Widget</option>
            <option value="KpiWidget">KPI Card</option>
            <option value="ChartWidget">Chart</option>
            <option value="TableWidget">Data Table</option>
            <option value="TextWidget">Text Label</option>
          </select>
          <button onClick={() => { setLayout([]); setWidgets([]); }} className="text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-md text-sm">Clear all</button>
          <span className="text-xs text-muted-foreground ml-4">{widgets.length} widgets</span>
          <button onClick={() => setStep(3)} disabled={widgets.length === 0} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-md text-sm font-medium ml-4">
            Next: Name & Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/20 relative p-6">
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
          {widgets.map(w => (
            <div key={w.id} className="bg-card border border-border border-dashed hover:border-solid rounded-lg shadow-sm flex flex-col group overflow-hidden">
              <div className="drag-handle bg-muted/50 p-2 text-xs font-semibold border-b border-border cursor-move flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                <span>{w.label}</span>
                <button onClick={() => { setLayout(layout.filter(l => String(l.i) !== w.id)); setWidgets(widgets.filter(ww => ww.id !== w.id)); }} className="text-muted-foreground hover:text-red-500"><X size={14} /></button>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                <button onClick={() => setSelectedWidgetId(w.id)} className="bg-violet-600/10 text-violet-500 hover:bg-violet-600/20 px-4 py-2 rounded-md font-medium text-sm transition-colors">
                  {w.saved_query_id ? 'Edit binding' : 'Bind query →'}
                </button>
              </div>
            </div>
          ))}
        </Grid>
      </div>

      {selectedWidgetId && (
        <div className="absolute inset-y-0 right-0 w-[400px] bg-card border-l border-border shadow-2xl z-30 flex flex-col animate-in slide-in-from-right">
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h3 className="font-semibold">Bind Query</h3>
            <button onClick={() => setSelectedWidgetId(null)} className="p-1 hover:bg-muted rounded"><X size={16} /></button>
          </div>
          <div className="p-4 flex-1 overflow-auto space-y-4">
             {/* Simplified binding panel */}
             <div>
               <label className="block text-xs font-medium text-muted-foreground mb-1">Widget Label</label>
               <input 
                 type="text" 
                 value={widgets.find(w => w.id === selectedWidgetId)?.label}
                 onChange={e => setWidgets(widgets.map(w => w.id === selectedWidgetId ? { ...w, label: e.target.value } : w))}
                 className="w-full bg-muted rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
               />
             </div>
             
             {widgets.find(w => w.id === selectedWidgetId)?.widget_type !== 'TextWidget' && (
               <div>
                 <label className="block text-xs font-medium text-muted-foreground mb-1">Saved Query</label>
                 <select 
                   value={widgets.find(w => w.id === selectedWidgetId)?.saved_query_id || ''}
                   onChange={e => setWidgets(widgets.map(w => w.id === selectedWidgetId ? { ...w, saved_query_id: e.target.value } : w))}
                   className="w-full bg-muted rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                 >
                   <option value="">Select a query...</option>
                   {savedQueries.map(sq => (
                     <option key={String(sq.id)} value={String(sq.id)}>{String(sq.label)}</option>
                   ))}
                 </select>
               </div>
             )}
             
             {/* We mock standard column configs directly here */}
             <div>
               <label className="block text-xs font-medium text-muted-foreground mb-1">Configuration (JSON)</label>
               <textarea 
                 rows={6}
                 value={widgets.find(w => w.id === selectedWidgetId)?.column_config_json}
                 onChange={e => setWidgets(widgets.map(w => w.id === selectedWidgetId ? { ...w, column_config_json: e.target.value } : w))}
                 className="w-full bg-muted rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500 font-mono"
                 placeholder='{"chartType": "Bar", "xAxisColumn": "month", "yAxisColumn": "sales"}'
               />
             </div>
          </div>
          <div className="p-4 border-t border-border bg-muted/30">
            <button onClick={() => setSelectedWidgetId(null)} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-md font-medium transition-colors">
              Confirm Binding
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const handleGenerateName = async () => {
    setIsAiLoading(true);
    try {
      const res = await dashboardsApi.generateName({ widgets });
      if (res.title) setName(res.title);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderStep3 = () => (
    <div className="flex flex-col items-center justify-center p-8 h-full relative">
      <button onClick={() => setStep(2)} className="absolute top-6 left-6 flex items-center text-muted-foreground hover:text-foreground">
        <ChevronLeft size={20} className="mr-1" /> Back to Canvas
      </button>
      
      <div className="bg-card border border-border p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Name your dashboard</h2>
        
        <input 
          type="text" 
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Sales Overview Q1 2024"
          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-violet-500 mb-2"
        />
        
        <button onClick={handleGenerateName} disabled={isAiLoading} className="text-violet-500 hover:text-violet-400 text-sm font-medium flex items-center mb-8 disabled:opacity-50">
          <Wand2 size={14} className="mr-1.5" />
          {isAiLoading ? 'Generating name...' : 'Generate name with AI'}
        </button>
        
        <div className="flex space-x-3 w-full">
          <button onClick={onCancel} className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button onClick={saveDashboard} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg font-medium transition-colors">
            Save Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-background relative">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
};
