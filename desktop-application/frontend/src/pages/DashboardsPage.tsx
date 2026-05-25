import React, { useState } from 'react';
import { DashboardList } from '../components/dashboard/DashboardList';
import { DashboardWizard } from '../components/dashboard/DashboardWizard';
import { DashboardView } from '../components/dashboard/DashboardView';
import type { Dashboard } from '../types/dashboard';
import { dashboardsApi } from '../api/dashboardsApi';

type ViewMode = 'list' | 'create' | 'view' | 'redesign';

export const DashboardsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [dashboardToRedesign, setDashboardToRedesign] = useState<Dashboard | null>(null);

  const handleCreate = () => {
    setDashboardToRedesign(null);
    setViewMode('create');
  };

  const handleView = (id: string) => {
    setActiveDashboardId(id);
    setViewMode('view');
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

  const handleCancelCreate = () => {
    setViewMode('list');
    setDashboardToRedesign(null);
  };

  const handleSaveSuccess = () => {
    setViewMode('list');
    setDashboardToRedesign(null);
  };

  return (
    <div className="w-full h-full overflow-hidden bg-background">
      {viewMode === 'list' && (
        <DashboardList 
          onCreate={handleCreate} 
          onView={handleView} 
          onRedesign={handleRedesign} 
        />
      )}
      
      {(viewMode === 'create' || viewMode === 'redesign') && (
        <DashboardWizard 
          onCancel={handleCancelCreate} 
          onSaveSuccess={handleSaveSuccess} 
          initialDashboard={dashboardToRedesign}
        />
      )}
      
      {viewMode === 'view' && activeDashboardId && (
        <DashboardView 
          dashboardId={activeDashboardId} 
          onBack={() => setViewMode('list')} 
          onRedesign={handleRedesign}
        />
      )}
    </div>
  );
};
