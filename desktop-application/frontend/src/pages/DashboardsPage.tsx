import React, { useEffect, useState, useCallback } from 'react';
import { Star, Plus, Trash2, Layout, Search, ChevronLeft, ChevronRight } from 'lucide-react';

import { dashboardsApi } from '../api/dashboardsApi';
import { DashboardView } from '../components/dashboard/DashboardView';
import { DashboardWizard } from '../components/dashboard/DashboardWizard';
import { formatDistanceToNow } from '../utils/formatters';
import type { Dashboard } from '../types/dashboard';

type ViewMode = 'view' | 'create' | 'redesign';

export const DashboardsPage: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');

  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dashboardToRedesign, setDashboardToRedesign] = useState<Dashboard | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadDashboards = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const data = await dashboardsApi.listDashboards(q, filter, sort);
      setDashboards(data);
      if (data.length > 0 && !selectedId && viewMode === 'view') {
        setSelectedId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load dashboards', e);
    } finally {
      setLoading(false);
    }
  }, [filter, sort, selectedId, viewMode, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboards();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sort]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    loadDashboards(e.target.value);
  };

  const toggleFavorite = async (id: string, current: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setDashboards((prev) =>
      prev.map((db) => (db.id === id ? { ...db, is_favorite: !current } : db))
    );
    try {
      await dashboardsApi.updateDashboard(id, { is_favorite: !current });
    } catch (err) {
      console.error(err);
      setDashboards((prev) =>
        prev.map((db) => (db.id === id ? { ...db, is_favorite: current } : db))
      );
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await dashboardsApi.deleteDashboard(id);
        if (selectedId === id) {
          setSelectedId(null);
        }
        loadDashboards();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreate = () => {
    setDashboardToRedesign(null);
    setViewMode('create');
  };

  const handleRedesign = async (id: string) => {
    try {
      const db = await dashboardsApi.getDashboard(id);
      setDashboardToRedesign(db);
      setViewMode('redesign');
    } catch (e) {
      console.error('Failed to fetch dashboard for redesign', e);
    }
  };

  const handleCancelWizard = () => {
    setViewMode('view');
    setDashboardToRedesign(null);
    loadDashboards();
  };

  const handleSaveSuccess = () => {
    setViewMode('view');
    setDashboardToRedesign(null);
    loadDashboards();
  };

  if (viewMode === 'create' || viewMode === 'redesign') {
    return (
      <div className="w-full h-full overflow-hidden bg-background">
        <DashboardWizard
          onCancel={handleCancelWizard}
          onSaveSuccess={handleSaveSuccess}
          initialDashboard={dashboardToRedesign}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex bg-background text-foreground overflow-hidden">
      {/* Left Collapsible Sidebar */}
      <div
        className={`border-r border-border bg-card flex flex-col transition-all duration-300 relative shrink-0 ${sidebarOpen ? 'w-80' : 'w-0 border-r-0'
          }`}
      >
        {sidebarOpen && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h1 className="text-lg font-bold tracking-tight">Dashboards</h1>
              <button
                onClick={handleCreate}
                className="bg-accent text-white hover:scale-[1.02] active:scale-[0.98] p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-accent/15"
              >
                <Plus size={14} />
                <span>New</span>
              </button>
            </div>

            {/* Filters and Search */}
            <div className="p-4 space-y-3 border-b border-border bg-muted/20">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={handleSearch}
                  className="w-full bg-background border border-input rounded-md pl-9 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                />
              </div>

              <div className="flex space-x-2">
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="flex-1 bg-background border border-input rounded-md px-2 py-1 text-xs outline-none cursor-pointer font-medium"
                >
                  <option value="all">All</option>
                  <option value="favorites">Favorites</option>
                  <option value="recent">Recent</option>
                </select>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="flex-1 bg-background border border-input rounded-md px-2 py-1 text-xs outline-none cursor-pointer font-medium"
                >
                  <option value="name">A-Z Name</option>
                  <option value="created">Created</option>
                  <option value="viewed">Updated</option>
                </select>
              </div>
            </div>

            {/* Sidebar Lists */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading && dashboards.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
              ) : dashboards.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No dashboards found.</div>
              ) : (
                dashboards.map(db => (
                  <div
                    key={db.id}
                    onClick={() => setSelectedId(db.id)}
                    className={`flex flex-col p-3 rounded-lg cursor-pointer transition-all border group relative ${selectedId === db.id
                        ? 'bg-accent/15 border-accent text-foreground'
                        : 'border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <Layout size={14} className={selectedId === db.id ? 'text-accent' : 'text-muted-foreground'} />
                        <span className="font-medium text-sm truncate">{db.title}</span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => toggleFavorite(db.id, db.is_favorite, e)}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-yellow-400"
                        >
                          <Star size={12} className={db.is_favorite ? 'text-yellow-400 fill-yellow-400' : ''} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(db.id, e)}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
                      <span>{db.widgets.length} metrics</span>
                      <span>{formatDistanceToNow(new Date(db.updated_at))}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sidebar Toggle Handle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-card border border-border rounded-full p-0.5 z-20 shadow-md hover:bg-muted transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      {/* Right Details Panel */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        {selectedId ? (
          <DashboardView
            dashboardId={selectedId}
            onBack={() => setSelectedId(null)}
            onRedesign={handleRedesign}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10">
            <Layout size={48} className="text-muted-foreground/30 mb-4 animate-bounce-slow" />
            <h2 className="text-xl font-semibold tracking-tight">No Dashboard Selected</h2>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Select an existing dashboard from the sidebar, or create a brand new interactive dashboard layout.
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 bg-accent text-white hover:scale-[1.02] active:scale-[0.98] px-4 py-2 rounded-md text-sm font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-accent/20"
            >
              <Plus size={16} />
              <span>Create Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

