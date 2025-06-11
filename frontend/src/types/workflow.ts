// Workflow status enum
export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}

// Node type enum
export enum NodeType {
  START = 'start',
  AGENT = 'agent',
  IF = 'if',
  END = 'end'
}

// Execution status enum
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
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

// Execution record interface
export interface Execution {
  id: number;
  workflow_id: number;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  current_node?: string;
  variables?: string; // JSON string
  error_message?: string;
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

export interface ContinueExecutionRequest {
  variables?: Record<string, any>;
} 