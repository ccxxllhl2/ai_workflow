import axios from 'axios';
import {
  Workflow,
  Agent,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  CreateAgentRequest,
  ExecuteWorkflowRequest
} from '../types/workflow';
import { config } from '../config/environment';

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Workflow API
export const workflowApi = {
  // Get workflow list
  getWorkflows: async (skip = 0, limit = 100): Promise<Workflow[]> => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    const response = await api.get(`/workflows?${params.toString()}`);
    return response.data;
  },

  // Create workflow
  createWorkflow: async (data: CreateWorkflowRequest): Promise<Workflow> => {
    const response = await api.post('/workflows', data);
    return response.data;
  },

  // Get workflow details
  getWorkflow: async (id: number): Promise<Workflow> => {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  // Update workflow
  updateWorkflow: async (id: number, data: UpdateWorkflowRequest): Promise<Workflow> => {
    const response = await api.put(`/workflows/${id}`, data);
    return response.data;
  },

  // Delete workflow
  deleteWorkflow: async (id: number): Promise<void> => {
    await api.delete(`/workflows/${id}`);
  },

  // Execute workflow (simplified to just trigger execution)
  executeWorkflow: async (id: number, data: ExecuteWorkflowRequest): Promise<{ message: string }> => {
    const response = await api.post(`/workflows/${id}/execute`, data);
    return response.data;
  },

  // Export workflow as JSON
  exportWorkflow: async (id: number): Promise<any> => {
    const response = await api.get(`/workflows/${id}/export`);
    return response.data;
  },

  // Download workflow as JSON file
  downloadWorkflow: async (id: number): Promise<void> => {
    const response = await api.get(`/workflows/${id}/export/download`, {
      responseType: 'blob',
    });
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'workflow.json';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create download link
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Import workflow from JSON
  importWorkflow: async (workflowData: any, name?: string, description?: string): Promise<{
    success: boolean;
    message: string;
    workflow_id?: number;
    workflow?: Workflow;
  }> => {
    const importRequest = {
      name,
      description,
      workflow_data: workflowData,
    };
    const response = await api.post('/workflows/import', importRequest);
    return response.data;
  },

  // Run workflow with parameters
  runWorkflow: async (workflowId: string, args?: Record<string, any>): Promise<{
    code: number;
    message: string;
    data: string;
  }> => {
    const response = await api.post('/workflows/run_workflow', {
      id: workflowId,
      args: args || {}
    });
    return response.data;
  },
};

// Agent API
export const agentApi = {
  // Get Agent list
  getAgents: async (skip = 0, limit = 100): Promise<Agent[]> => {
    const response = await api.get(`/agents?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Create Agent
  createAgent: async (data: CreateAgentRequest): Promise<Agent> => {
    const response = await api.post('/agents', data);
    return response.data;
  },

  // Get Agent details
  getAgent: async (id: number): Promise<Agent> => {
    const response = await api.get(`/agents/${id}`);
    return response.data;
  },

  // Update Agent
  updateAgent: async (id: number, data: Partial<CreateAgentRequest>): Promise<Agent> => {
    const response = await api.put(`/agents/${id}`, data);
    return response.data;
  },

  // Delete Agent
  deleteAgent: async (id: number): Promise<void> => {
    await api.delete(`/agents/${id}`);
  },
};

// 获取外部Agent信息
export const externalAgentApi = {
  // 获取所有外部Agent
  getExternalAgents: async () => {
    const response = await fetch(`${config.apiBaseUrl}/api/external-agents`);
    if (!response.ok) {
      throw new Error('Failed to fetch external agents');
    }
    return response.json();
  }
};

export default api; 