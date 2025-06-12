import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
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
import EndNode from './NodeTypes/EndNode';
import JiraNode from './NodeTypes/JiraNode';
import ConfluenceNode from './NodeTypes/ConfluenceNode';
import NodeConfigPanel from './NodeConfigPanel/NodeConfigPanel';
import VariablePanel from './VariablePanel/VariablePanel';
import ExecutionResultModal from './ExecutionResultModal/ExecutionResultModal';
import { NodeType, WorkflowNode, Workflow, WorkflowStatus } from '../types/workflow';
import { workflowApi } from '../services/api';
import { extractVariablesFromNodes } from '../utils/variableExtractor';

const nodeTypes: NodeTypes = {
  start: StartNode,
  agent: AgentNode,
  if: IfNode,
  end: EndNode,
  jira: JiraNode,
  confluence: ConfluenceNode,
};

interface WorkflowEditorProps {
  workflow?: Workflow | null;
  onSave?: (workflow: Workflow) => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ workflow, onSave }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isVariablePanelOpen, setIsVariablePanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  
  // Use useRef to maintain node ID counter
  const nodeIdCounter = useRef(0);

  // Use useMemo to calculate variable list and avoid unnecessary recalculation
  const variables = useMemo(() => {
    return extractVariablesFromNodes(nodes as WorkflowNode[]);
  }, [nodes]);

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

  // 监听节点配置事件
  useEffect(() => {
    const handleNodeConfig = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setSelectedNode(node as WorkflowNode);
        setIsConfigPanelOpen(true);
      }
    };

    window.addEventListener('nodeConfig', handleNodeConfig as EventListener);
    return () => {
      window.removeEventListener('nodeConfig', handleNodeConfig as EventListener);
    };
  }, [nodes]);

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
      case NodeType.END:
        return 'End';
      case NodeType.JIRA:
        return 'Jira';
      case NodeType.CONFLUENCE:
        return 'Confluence';
      default:
        return 'Unknown Node';
    }
  };

  const getDefaultConfig = (type: NodeType): any => {
    switch (type) {
      case NodeType.START:
        return { 
          initialVariables: '{}',
          variableDescriptions: '{}'
        };
      case NodeType.AGENT:
        return { 
          prompt: '', 
          modelType: 'qwen',
          modelName: 'qwen-turbo'
        };
      case NodeType.IF:
        return { condition: '', trueLabel: 'Yes', falseLabel: 'No' };
      case NodeType.END:
        return { outputFormat: 'json', successCode: 200 };
      case NodeType.JIRA:
        return { 
          project: '',
          issueType: '',
          assignee: '',
          status: ''
        };
      case NodeType.CONFLUENCE:
        return { 
          pageTitle: '',
          pageUrl: '',
          spaceKey: '',
          content: ''
        };
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
    // Variable list will be automatically updated after node configuration is saved (via useMemo)
  };

  const publishWorkflow = async () => {
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
        config: JSON.stringify(config),
        status: WorkflowStatus.ACTIVE // Set status to active when publishing
      });

      if (onSave) {
        onSave(updatedWorkflow);
      }

      alert('Workflow published successfully!');
    } catch (err) {
      alert('Failed to publish workflow');
      console.error('Failed to publish workflow:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const testExecuteWorkflow = async () => {
    if (!workflow) {
      alert('Please select or create a workflow first');
      return;
    }

    if (workflow.status !== WorkflowStatus.ACTIVE) {
      alert('Please publish the workflow first');
      return;
    }

    // Open execution result modal
    setIsExecutionModalOpen(true);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Workflow Editor
            {workflow && <span className="text-gray-500 ml-2 font-normal">- {workflow.name}</span>}
          </h1>
          
          <div className="flex items-center space-x-3">
            {/* Variable Panel Toggle */}
            <button
              onClick={() => setIsVariablePanelOpen(!isVariablePanelOpen)}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                isVariablePanelOpen
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Variables
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {variables.length}
              </span>
            </button>
            
            <button
              onClick={publishWorkflow}
              disabled={isSaving || !workflow}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {isSaving ? 'Publishing...' : 'Publish'}
            </button>
            
            <button
              onClick={testExecuteWorkflow}
              disabled={!workflow || workflow.status !== WorkflowStatus.ACTIVE}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Test Execute
            </button>
          </div>
        </div>
        
        {/* Node Add Buttons */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => addNode(NodeType.START)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-800 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
            </svg>
            Start Node
          </button>
          <button
            onClick={() => addNode(NodeType.AGENT)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
            AI Agent
          </button>
          <button
            onClick={() => addNode(NodeType.JIRA)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129V13.1a5.218 5.218 0 0 0 5.232-5.215V6.782a1.024 1.024 0 0 0-1.018-1.025zM23.013.592H11.455a5.215 5.215 0 0 0 5.215 5.214h2.129V7.863a5.218 5.218 0 0 0 5.232-5.215V1.617A1.024 1.024 0 0 0 23.013.592z"/>
            </svg>
            Jira
          </button>
          <button
            onClick={() => addNode(NodeType.CONFLUENCE)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-800 bg-indigo-100 border border-indigo-200 rounded-lg hover:bg-indigo-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.87 19.492c.494 1.516 1.528 2.594 3.01 3.14.49.18.995.252 1.528.22 1.51-.09 2.84-.99 3.61-2.45l4.75-9.03c1.21-2.3 3.99-3.19 6.29-1.98 2.3 1.21 3.19 3.99 1.98 6.29l-1.65 3.14c-.15.29-.03.65.26.8.29.15.65.03.8-.26l1.65-3.14c1.8-3.42.37-7.71-3.05-9.51-3.42-1.8-7.71-.37-9.51 3.05L4.77 18.832c-.54 1.02-1.47 1.65-2.53 1.71-.36.02-.71-.03-1.07-.15-1.04-.38-1.78-1.14-2.15-2.2-.15-.42-.05-.87.32-1.02.37-.15.83-.03.98.35zm22.26-14.98c-.49-1.516-1.528-2.594-3.01-3.14-.49-.18-.995-.252-1.528-.22-1.51.09-2.84.99-3.61 2.45l-4.75 9.03c-1.21 2.3-3.99 3.19-6.29 1.98-2.3-1.21-3.19-3.99-1.98-6.29l1.65-3.14c.15-.29.03-.65-.26-.8-.29-.15-.65-.03-.8.26l-1.65 3.14c-1.8 3.42-.37 7.71 3.05 9.51 3.42 1.8 7.71.37 9.51-3.05L19.23 5.168c.54-1.02 1.47-1.65 2.53-1.71.36-.02.71.03 1.07.15 1.04.38 1.78 1.14 2.15 2.2.15.42.05.87-.32 1.02-.37.15-.83.03-.98-.35z"/>
            </svg>
            Confluence
          </button>
          <button
            onClick={() => addNode(NodeType.IF)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Condition
          </button>
          <button
            onClick={() => addNode(NodeType.END)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-800 bg-red-100 border border-red-200 rounded-lg hover:bg-red-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4l2.5 1.5a1 1 0 11-1 1.732L9 12.732V7a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
            End Node
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 relative">
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

        {/* Variable Panel */}
        <VariablePanel
          variables={variables}
          isOpen={isVariablePanelOpen}
          onToggle={() => setIsVariablePanelOpen(!isVariablePanelOpen)}
        />
      </div>

      {/* Node Configuration Panel */}
      <NodeConfigPanel
        node={selectedNode}
        isOpen={isConfigPanelOpen}
        onClose={() => setIsConfigPanelOpen(false)}
        onSave={handleNodeConfigSave}
        allNodes={nodes as WorkflowNode[]}
      />

      {/* Execution Result Modal */}
      <ExecutionResultModal
        isOpen={isExecutionModalOpen}
        onClose={() => setIsExecutionModalOpen(false)}
        workflowId={workflow?.id || 0}
        nodes={nodes as WorkflowNode[]}
        edges={edges}
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