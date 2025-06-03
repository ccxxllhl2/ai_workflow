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
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// User types
export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface WorkflowRating {
  id: number;
  user_id: number;
  workflow_id: number;
  is_liked: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowWithRating extends Workflow {
  user_rating: boolean | null;
  like_count: number;
  dislike_count: number;
}

// Workflow API
export const workflowApi = {
  // Get workflow list with ratings
  getWorkflows: async (skip = 0, limit = 100, userId?: number): Promise<WorkflowWithRating[]> => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (userId) {
      params.append('user_id', userId.toString());
    }
    const response = await api.get(`/workflows?${params.toString()}`);
    return response.data;
  },

  // Create workflow
  createWorkflow: async (data: CreateWorkflowRequest): Promise<Workflow> => {
    const response = await api.post('/workflows', data);
    return response.data;
  },

  // Get workflow details with ratings
  getWorkflow: async (id: number, userId?: number): Promise<WorkflowWithRating> => {
    const params = new URLSearchParams();
    if (userId) {
      params.append('user_id', userId.toString());
    }
    const response = await api.get(`/workflows/${id}?${params.toString()}`);
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

  // Execute workflow - Fixed: use executions router
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
  // Execute workflow - duplicate, use workflowApi.executeWorkflow instead
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
    if (workflowId) params.append('workflow_id', workflowId.toString());
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    const response = await api.get(`/executions?${params.toString()}`);
    return response.data;
  },

  // Continue execution
  continueExecution: async (id: number, data: ContinueExecutionRequest): Promise<Execution> => {
    const response = await api.post(`/executions/${id}/continue`, data);
    return response.data;
  },

  // Stop execution
  stopExecution: async (id: number): Promise<void> => {
    await api.post(`/executions/${id}/stop`);
  },

  // Delete execution record
  deleteExecution: async (id: number): Promise<void> => {
    await api.delete(`/executions/${id}`);
  },

  // Get execution variables
  getExecutionVariables: async (id: number): Promise<{execution_id: number, variables: Record<string, any>}> => {
    const response = await api.get(`/executions/${id}/variables`);
    return response.data;
  },

  // Chat with Qwen
  chatWithQwen: async (id: number, message: string): Promise<{reply: string, success: boolean}> => {
    const response = await api.post(`/executions/${id}/chat`, { message });
    return response.data;
  },

  // Get execution history
  getExecutionHistory: async (id: number): Promise<{execution_id: number, history: any[]}> => {
    const response = await api.get(`/executions/${id}/history`);
    return response.data;
  },
};

// Authentication API
export const authApi = {
  // User login
  login: async (data: LoginRequest): Promise<User> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // Get all users (for testing)
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  // Get user by ID
  getUser: async (id: number): Promise<User> => {
    const response = await api.get(`/auth/users/${id}`);
    return response.data;
  },
};

// Rating API
export const ratingApi = {
  // Create or update rating
  createOrUpdateRating: async (
    userId: number,
    workflowId: number,
    isLiked: boolean | null
  ): Promise<WorkflowRating> => {
    const response = await api.post(`/ratings/?user_id=${userId}`, {
      workflow_id: workflowId,
      is_liked: isLiked,
    });
    return response.data;
  },

  // Get workflow rating stats
  getWorkflowRatingStats: async (workflowId: number): Promise<{
    workflow_id: number;
    like_count: number;
    dislike_count: number;
  }> => {
    const response = await api.get(`/ratings/workflow/${workflowId}/stats`);
    return response.data;
  },

  // Get user rating for workflow
  getUserRating: async (userId: number, workflowId: number): Promise<{
    is_liked: boolean | null;
  }> => {
    const response = await api.get(`/ratings/user/${userId}/workflow/${workflowId}`);
    return response.data;
  },
};

export default api; 