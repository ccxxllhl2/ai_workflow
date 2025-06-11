import axios from 'axios';
import {
  Workflow,
  Agent,
  Execution,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  CreateAgentRequest,
  ExecuteWorkflowRequest,
  ContinueExecutionRequest
} from '../types/workflow';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:8001/api',
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

  // Execute workflow
  executeWorkflow: async (id: number, data: ExecuteWorkflowRequest): Promise<Execution> => {
    const response = await api.post(`/executions/${id}/execute`, data);
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

// Execution API
export const executionApi = {
  // Execute workflow
  executeWorkflow: async (workflowId: number, data: ExecuteWorkflowRequest = {}): Promise<Execution> => {
    const response = await api.post(`/executions/${workflowId}/execute`, data);
    return response.data;
  },

  // Get execution record
  getExecution: async (id: number): Promise<Execution> => {
    const response = await api.get(`/executions/${id}`);
    return response.data;
  },

  // Get execution final output
  getFinalOutput: async (id: number): Promise<{execution_id: number, final_output: any, has_output: boolean}> => {
    const response = await api.get(`/executions/${id}/final-output`);
    return response.data;
  },

  // Get execution record list
  getExecutions: async (workflowId?: number, skip = 0, limit = 100): Promise<Execution[]> => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (workflowId) {
      params.append('workflow_id', workflowId.toString());
    }
    const response = await api.get(`/executions?${params.toString()}`);
    return response.data;
  },

  // Continue execution
  continueExecution: async (id: number, data: ContinueExecutionRequest = {}): Promise<Execution> => {
    const response = await api.post(`/executions/${id}/continue`, data);
    return response.data;
  },

  // Stop execution
  stopExecution: async (id: number): Promise<void> => {
    await api.post(`/executions/${id}/stop`);
  },

  // Delete execution
  deleteExecution: async (id: number): Promise<void> => {
    await api.delete(`/executions/${id}`);
  },

  // Get execution variables
  getExecutionVariables: async (id: number): Promise<{execution_id: number, variables: Record<string, any>}> => {
    const response = await api.get(`/executions/${id}/variables`);
    return response.data;
  },

  // Get execution history
  getExecutionHistory: async (id: number): Promise<{execution_id: number, history: any[]}> => {
    const response = await api.get(`/executions/${id}/history`);
    return response.data;
  },
};

export default api; 