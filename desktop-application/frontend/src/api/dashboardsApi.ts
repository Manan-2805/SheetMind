import { apiClient } from './apiClient';
import type { Dashboard, DashboardWidget, WidgetResult } from '../types/dashboard';

export interface AINameGenRequest {
  widgets: DashboardWidget[];
}
export interface AINameGenResponse {
  title: string;
}

export interface AIDashboardGenRequest {
  description: string;
}
export interface AIDashboardGenResponse {
  title: string;
  widgets: Record<string, unknown>[];
}

export const dashboardsApi = {
  listDashboards: async (q?: string, filter?: string, sort?: string): Promise<Dashboard[]> => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (filter) params.append('filter', filter);
    if (sort) params.append('sort', sort);
    
    const res = await apiClient.get(`/dashboards?${params.toString()}`);
    return res.data;
  },
  
  getDashboard: async (id: string): Promise<Dashboard> => {
    const res = await apiClient.get(`/dashboards/${id}`);
    return res.data;
  },
  
  createDashboard: async (data: Partial<Dashboard>): Promise<Dashboard> => {
    const res = await apiClient.post('/dashboards', data);
    return res.data;
  },
  
  updateDashboard: async (id: string, data: Partial<Dashboard>): Promise<Dashboard> => {
    const res = await apiClient.put(`/dashboards/${id}`, data);
    return res.data;
  },
  
  deleteDashboard: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete(`/dashboards/${id}`);
    return res.data;
  },
  
  refreshDashboard: async (id: string): Promise<Record<string, WidgetResult>> => {
    const res = await apiClient.get(`/dashboards/${id}/refresh`);
    return res.data;
  },
  
  generateName: async (data: AINameGenRequest): Promise<AINameGenResponse> => {
    const res = await apiClient.post('/dashboards/generate-name', data);
    return res.data;
  },
  
  generateLayout: async (data: AIDashboardGenRequest): Promise<AIDashboardGenResponse> => {
    const res = await apiClient.post('/dashboards/generate-layout', data);
    return res.data;
  }
};
