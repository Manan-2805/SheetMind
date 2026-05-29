import React, { useEffect, useState } from 'react';
import { Star, Plus, Edit2, LayoutTemplate, Trash2 } from 'lucide-react';
import type { Dashboard } from '../../types/dashboard';
import { dashboardsApi } from '../../api/dashboardsApi';
import { formatDistanceToNow } from '../../utils/formatters';

interface DashboardListProps {
  onCreate: () => void;
  onView: (id: string) => void;
  onRedesign: (id: string) => void;
}

export const DashboardList: React.FC<DashboardListProps> = ({ onCreate, onView, onRedesign }) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');

  const loadDashboards = async (q = search) => {
    setLoading(true);
    try {
      const data = await dashboardsApi.listDashboards(q, filter, sort);
      setDashboards(data);
    } catch (e) {
      console.error('Failed to load dashboards', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sort]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    loadDashboards(e.target.value);
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    setDashboards((prev) =>
      prev.map((db) => (db.id === id ? { ...db, is_favorite: !current } : db))
    );
    try {
      await dashboardsApi.updateDashboard(id, { is_favorite: !current });
    } catch (e) {
      console.error(e);
      setDashboards((prev) =>
        prev.map((db) => (db.id === id ? { ...db, is_favorite: current } : db))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await dashboardsApi.deleteDashboard(id);
        loadDashboards();
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (loading && dashboards.length === 0) {
    return <div className="p-8">Loading dashboards...</div>;
  }

  if (dashboards.length === 0 && !search) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-muted-foreground">No dashboards yet. Create your first one.</div>
        <button 
          onClick={onCreate}
          className="bg-accent hover:scale-[1.02] active:scale-[0.98] text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-all shadow-lg shadow-accent/20"
        >
          <Plus size={16} />
          <span>Create Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h1 className="text-2xl font-bold">Dashboards</h1>
        <button 
          onClick={onCreate}
          className="bg-accent hover:scale-[1.02] active:scale-[0.98] text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-all shadow-lg shadow-accent/20"
        >
          <Plus size={16} />
          <span>Create Dashboard</span>
        </button>
      </div>
      
      <div className="p-6 flex space-x-4 items-center">
        <input 
          type="text" 
          placeholder="Search dashboards..." 
          value={search}
          onChange={handleSearch}
          className="flex-1 bg-muted border-none rounded-md px-4 py-2 focus:ring-2 focus:ring-accent/50 outline-none"
        />
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          className="bg-muted border-none rounded-md px-4 py-2 outline-none cursor-pointer text-sm font-medium"
        >
          <option value="all">All</option>
          <option value="favorites">Favorites</option>
          <option value="recent">Recent</option>
        </select>
        <select 
          value={sort} 
          onChange={e => setSort(e.target.value)}
          className="bg-muted border-none rounded-md px-4 py-2 outline-none cursor-pointer text-sm font-medium"
        >
          <option value="name">Sort by Name</option>
          <option value="created">Sort by Created Date</option>
          <option value="viewed">Sort by Last Viewed</option>
        </select>
      </div>
      
      <div className="flex-1 overflow-auto p-6 pt-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-3 font-medium w-8"></th>
              <th className="py-3 font-medium">Name</th>
              <th className="py-3 font-medium text-center">Widgets</th>
              <th className="py-3 font-medium text-right">Last viewed</th>
              <th className="py-3 font-medium text-right">Created</th>
              <th className="py-3 font-medium text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dashboards.map(db => (
              <tr key={db.id} className="border-b border-border hover:bg-muted/50 group transition-colors cursor-pointer" onClick={() => onView(db.id)}>
                <td className="py-4" onClick={(e) => { e.stopPropagation(); toggleFavorite(db.id, db.is_favorite); }}>
                  <Star size={18} className={`cursor-pointer transition-colors ${db.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-foreground'}`} />
                </td>
                <td className="py-4 font-medium">{db.title}</td>
                <td className="py-4 text-center">
                  <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-semibold">{db.widgets.length}</span>
                </td>
                <td className="py-4 text-right text-muted-foreground text-sm">{formatDistanceToNow(new Date(db.updated_at))}</td>
                <td className="py-4 text-right text-muted-foreground text-sm">{formatDistanceToNow(new Date(db.created_at))}</td>
                <td className="py-4 text-right pr-4">
                  <div className="flex justify-end space-x-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => onView(db.id)} className="p-2 text-muted-foreground hover:text-accent transition-colors" title="View">
                      <LayoutTemplate size={16} />
                    </button>
                    <button onClick={() => onRedesign(db.id)} className="p-2 text-muted-foreground hover:text-accent transition-colors" title="Redesign">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(db.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
