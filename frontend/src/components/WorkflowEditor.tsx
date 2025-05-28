import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  OnConnect,
  NodeTypes,
  ReactFlowProvider,
} from 'reactflow';

import 'reactflow/dist/style.css';

import StartNode from './NodeTypes/StartNode';
import AgentNode from './NodeTypes/AgentNode';
import IfNode from './NodeTypes/IfNode';
import HumanControlNode from './NodeTypes/HumanControlNode';
import EndNode from './NodeTypes/EndNode';
import NodeConfigPanel from './NodeConfigPanel/NodeConfigPanel';
import { NodeType, WorkflowNode, Workflow, ExecutionStatus } from '../types/workflow';
import { workflowApi, executionApi } from '../services/api';

const nodeTypes: NodeTypes = {
  start: StartNode,
  agent: AgentNode,
  if: IfNode,
  human_control: HumanControlNode,
  end: EndNode,
};

interface WorkflowEditorProps {
  workflow?: Workflow | null;
  onSave?: (workflow: Workflow) => void;
  onViewExecution?: () => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflow, onSave, onViewExecution }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState<number | null>(null);
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);
  
  // Use useRef to maintain node ID counter
  const nodeIdCounter = useRef(0);

  // Load nodes and edges from workflow configuration
  useEffect(() => {
    if (workflow && workflow.config) {
      try {
        const config = JSON.parse(workflow.config);
        if (config.nodes) {
          setNodes(config.nodes);
        }
        if (config.edges) {
          setEdges(config.edges);
        }
      } catch (err) {
        console.error('Failed to parse workflow configuration:', err);
      }
    }
  }, [workflow, setNodes, setEdges]);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const getId = () => {
    // Ensure unique ID, considering existing nodes
    const existingIds = nodes.map(node => node.id);
    let newId;
    do {
      newId = `node_${nodeIdCounter.current++}`;
    } while (existingIds.includes(newId));
    return newId;
  };

  const addNode = (type: NodeType) => {
    const id = getId();
    const label = getNodeLabel(type);
    
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { 
        label,
        config: getDefaultConfig(type)
      },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const getNodeLabel = (type: NodeType): string => {
    switch (type) {
      case NodeType.START:
        return 'Start';
      case NodeType.AGENT:
        return 'AI Agent';
      case NodeType.IF:
        return 'Condition';
      case NodeType.HUMAN_CONTROL:
        return 'Human Control';
      case NodeType.END:
        return 'End';
      default:
        return 'Unknown Node';
    }
  };

  const getDefaultConfig = (type: NodeType): any => {
    switch (type) {
      case NodeType.START:
        return { initialVariables: '{}' };
      case NodeType.AGENT:
        return { 
          prompt: '', 
          outputVariable: 'agent_output',
          modelType: 'qwen',
          modelName: 'qwen-turbo'
        };
      case NodeType.IF:
        return { condition: '', trueLabel: 'Yes', falseLabel: 'No' };
      case NodeType.HUMAN_CONTROL:
        return { message: '', timeout: 300, allowContinue: true };
      case NodeType.END:
        return { outputFormat: 'json', successCode: 200 };
      default:
        return {};
    }
  };

  const onNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as WorkflowNode);
    setIsConfigPanelOpen(true);
  };

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    if (window.confirm(`Are you sure you want to delete node "${node.data.label}"?`)) {
      deleteNode(node.id);
    }
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Delete' && selectedNode) {
      deleteNode(selectedNode.id);
      setSelectedNode(null);
      setIsConfigPanelOpen(false);
    }
  };

  const handleNodeConfigSave = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config,
              label: config.label || node.data.label,
            },
          };
        }
        return node;
      })
    );
  };

  const saveWorkflow = async () => {
    if (!workflow) {
      alert('Please select or create a workflow first');
      return;
    }

    try {
      setIsSaving(true);
      
      const config = {
        nodes,
        edges
      };

      const updatedWorkflow = await workflowApi.updateWorkflow(workflow.id, {
        config: JSON.stringify(config)
      });

      if (onSave) {
        onSave(updatedWorkflow);
      }

      alert('Workflow saved successfully!');
    } catch (err) {
      alert('Failed to save workflow');
      console.error('Failed to save workflow:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const executeWorkflow = async () => {
    if (!workflow) {
      alert('Please select a workflow first');
      return;
    }

    try {
      // Save current workflow first
      await saveWorkflow();
      
      // Execute workflow
      const execution = await executionApi.executeWorkflow(workflow.id);
      setCurrentExecutionId(execution.id);
      setExecutionStatus(execution.status);
      
      // Start polling execution status
      pollExecutionStatus(execution.id);
    } catch (err) {
      alert('Failed to start execution');
      console.error('Failed to start execution:', err);
    }
  };

  const pollExecutionStatus = async (executionId: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const execution = await executionApi.getExecution(executionId);
        setExecutionStatus(execution.status);
        setExecutingNodeId(execution.current_node || null);

        // Update node styles to show execution status
        setNodes((nds) =>
          nds.map((node) => ({
            ...node,
            style: {
              ...node.style,
              backgroundColor: node.id === execution.current_node ? '#fbbf24' : undefined,
              borderColor: node.id === execution.current_node ? '#f59e0b' : undefined,
              borderWidth: node.id === execution.current_node ? 2 : undefined,
            },
          }))
        );

        // If execution completed, stop polling
        if (execution.status === ExecutionStatus.COMPLETED || 
            execution.status === ExecutionStatus.FAILED) {
          clearInterval(pollInterval);
          setExecutingNodeId(null);
          
          // Reset node styles
          setNodes((nds) =>
            nds.map((node) => ({
              ...node,
              style: {
                backgroundColor: undefined,
                borderColor: undefined,
                borderWidth: undefined,
              },
            }))
          );
        }
      } catch (err) {
        console.error('Failed to get execution status:', err);
        clearInterval(pollInterval);
      }
    }, 1000);

    // Stop polling after 30 seconds
    setTimeout(() => clearInterval(pollInterval), 30000);
  };

  const getExecutionStatusColor = (status: ExecutionStatus | null) => {
    if (!status) return 'bg-gray-500';
    switch (status) {
      case ExecutionStatus.PENDING:
        return 'bg-yellow-500';
      case ExecutionStatus.RUNNING:
        return 'bg-blue-500';
      case ExecutionStatus.PAUSED:
        return 'bg-orange-500';
      case ExecutionStatus.COMPLETED:
        return 'bg-green-500';
      case ExecutionStatus.FAILED:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            Workflow Editor
            {workflow && <span className="text-gray-500 ml-2">- {workflow.name}</span>}
          </h1>
          
          <div className="flex items-center space-x-2">
            {/* Execution Status Indicator */}
            {executionStatus && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getExecutionStatusColor(executionStatus)}`} />
                <span className="text-sm text-gray-600">
                  {executionStatus}
                  {executingNodeId && ` - Executing Node: ${executingNodeId}`}
                </span>
              </div>
            )}
            
            <button
              onClick={executeWorkflow}
              disabled={!workflow || executionStatus === ExecutionStatus.RUNNING}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {executionStatus === ExecutionStatus.RUNNING ? 'Executing...' : 'Execute Workflow'}
            </button>

            <button
              onClick={onViewExecution}
              disabled={!workflow}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              Execution Manager
            </button>
            
            <button
              onClick={saveWorkflow}
              disabled={isSaving || !workflow}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        {/* Node Add Buttons */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => addNode(NodeType.START)}
            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            Start Node
          </button>
          <button
            onClick={() => addNode(NodeType.AGENT)}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Agent Node
          </button>
          <button
            onClick={() => addNode(NodeType.IF)}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
          >
            Condition
          </button>
          <button
            onClick={() => addNode(NodeType.HUMAN_CONTROL)}
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
          >
            Human Control
          </button>
          <button
            onClick={() => addNode(NodeType.END)}
            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            End Node
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={() => setSelectedNode(null)}
          onKeyDown={onKeyDown}
          nodeTypes={nodeTypes}
          fitView
          tabIndex={0}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Node Configuration Panel */}
      <NodeConfigPanel
        node={selectedNode}
        isOpen={isConfigPanelOpen}
        onClose={() => setIsConfigPanelOpen(false)}
        onSave={handleNodeConfigSave}
      />
    </div>
  );
};

// Wrapper component to provide ReactFlowProvider
const WorkflowEditorWithProvider: React.FC<WorkflowEditorProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowEditor {...props} />
  </ReactFlowProvider>
);

export default WorkflowEditorWithProvider; 