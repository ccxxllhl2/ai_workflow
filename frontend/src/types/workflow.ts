// Workflow status enum
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

// Node type enum
export enum NodeType {
  START = 'start',
  AGENT = 'agent',
  IF = 'if',
  END = 'end',
  JIRA = 'jira',
  CONFLUENCE = 'confluence'
}

// Variable type enum
export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json'
}

// Workflow interface
export interface Workflow {
  id: number;
  name: string;
  description?: string;
  config: string; // JSON string
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
}

// Workflow node interface
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: any;
  };
}

// Variable interface
export interface Variable {
  id: number;
  name: string;
  type: VariableType;
  value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Agent interface
export interface Agent {
  id: number;
  name: string;
  model: string;
  config: string; // JSON string
  created_at: string;
  updated_at: string;
}

// 外部Agent类型
export interface ExternalAgent {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  modelName: string;
  systemPrompt: string;
  callCount: number;
  temperature: number;
  maxTokens: number;
  createTime: string;
  updateTime: string;
}

// Workflow config interface
export interface WorkflowConfig {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// Workflow edge interface
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// API request interfaces
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  config: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  config?: string;
  status?: WorkflowStatus;
}

export interface CreateAgentRequest {
  name: string;
  model: string;
  config: string;
}

export interface ExecuteWorkflowRequest {
  variables?: Record<string, any>;
} 