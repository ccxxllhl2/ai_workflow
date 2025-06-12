import React, { useEffect, useState, useCallback } from 'react';
import { WorkflowNode } from '../../types/workflow';

interface ExecutionStep {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  input: any;
  output: any;
  status: 'success' | 'error' | 'pending';
  timestamp: string;
  executionTime?: number;
}

interface ExecutionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: number;
  nodes: WorkflowNode[];
  edges: Array<{ source: string; target: string; id: string }>;
}

const ExecutionResultModal: React.FC<ExecutionResultModalProps> = ({
  isOpen,
  onClose,
  workflowId,
  nodes,
  edges
}) => {
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  // Function to sort nodes based on their connections (topological sort)
  const sortNodesByExecutionOrder = useCallback((nodes: WorkflowNode[], edges: Array<{ source: string; target: string; id: string }>) => {
    // Find the start node
    const startNode = nodes.find(node => node.type === 'start');
    if (!startNode) {
      // If no start node, fallback to original sorting
      return [...nodes].sort((a, b) => {
        const typeOrder = { start: 0, agent: 1, jira: 2, confluence: 3, if: 4, end: 5 };
        return (typeOrder[a.type as keyof typeof typeOrder] || 3) - (typeOrder[b.type as keyof typeof typeOrder] || 3);
      });
    }

    const sortedNodes: WorkflowNode[] = [];
    const visited = new Set<string>();
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      adjacencyList.get(edge.source)!.push(edge.target);
    });

    // DFS traversal starting from start node
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (node) {
        sortedNodes.push(node);
      }

      // Visit connected nodes
      const connectedNodes = adjacencyList.get(nodeId) || [];
      connectedNodes.forEach(connectedNodeId => {
        dfs(connectedNodeId);
      });
    };

    dfs(startNode.id);

    // Add any unconnected nodes at the end
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        sortedNodes.push(node);
      }
    });

    return sortedNodes;
  }, []);

  const simulateExecution = useCallback(async () => {
    setIsExecuting(true);
    setCurrentStep(-1);
    setExecutionSteps([]);

    // Sort nodes by actual execution order based on connections
    const sortedNodes = sortNodesByExecutionOrder(nodes, edges);

    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      setCurrentStep(i);

      // Generate mock input/output based on node type
      const mockStep = generateMockStep(node, i);
      
      setExecutionSteps(prev => [...prev, mockStep]);
      
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsExecuting(false);
    setCurrentStep(-1);
  }, [nodes, edges, sortNodesByExecutionOrder]);

  useEffect(() => {
    if (isOpen) {
      // Simulate execution steps based on node order
      simulateExecution();
    }
  }, [isOpen, simulateExecution]);

  const generateMockStep = (node: WorkflowNode, index: number): ExecutionStep => {
    const timestamp = new Date().toLocaleTimeString();
    
    switch (node.type) {
      case 'start':
        return {
          nodeId: node.id,
          nodeName: node.data.label,
          nodeType: 'Start Node',
          input: { trigger: 'manual' },
          output: { status: 'initialized', variables: { sessionId: 'exec_' + Date.now() } },
          status: 'success',
          timestamp,
          executionTime: 120
        };
      
      case 'agent':
        return {
          nodeId: node.id,
          nodeName: node.data.label,
          nodeType: 'AI Agent',
          input: { 
            prompt: node.data.config?.prompt || 'Default AI prompt',
            model: node.data.config?.modelName || 'qwen-turbo'
          },
          output: { 
            response: 'Based on the analysis, I recommend proceeding with the proposed solution. The data indicates a 85% confidence level in the outcome.',
            tokens_used: 245,
            processing_time: '2.3s'
          },
          status: 'success',
          timestamp,
          executionTime: 2300
        };
      
      case 'jira':
        return {
          nodeId: node.id,
          nodeName: node.data.label,
          nodeType: 'Jira Integration',
          input: {
            project: node.data.config?.project || 'DEMO',
            issueType: node.data.config?.issueType || 'Task',
            summary: 'Auto-generated task from workflow'
          },
          output: {
            message: 'Preview mode: Would create Jira ticket',
            ticketId: 'DEMO-123',
            status: 'preview'
          },
          status: 'success',
          timestamp,
          executionTime: 800
        };
      
      case 'confluence':
        return {
          nodeId: node.id,
          nodeName: node.data.label,
          nodeType: 'Confluence Integration',
          input: {
            spaceKey: node.data.config?.spaceKey || 'DEMO',
            pageTitle: node.data.config?.pageTitle || 'Auto-generated page'
          },
          output: {
            message: 'Preview mode: Would create Confluence page',
            pageUrl: 'https://demo.atlassian.net/wiki/spaces/DEMO/pages/123456',
            status: 'preview'
          },
          status: 'success',
          timestamp,
          executionTime: 950
        };
      
      case 'end':
        return {
          nodeId: node.id,
          nodeName: node.data.label,
          nodeType: 'End Node',
          input: { finalResult: 'Workflow completed successfully' },
          output: { 
            status: 'completed',
            totalExecutionTime: '6.2s',
            result: 'success'
          },
          status: 'success',
          timestamp,
          executionTime: 50
        };
      
      default:
        return {
          nodeId: node.id,
          nodeName: node.data.label,
          nodeType: node.type,
          input: { data: 'Input data' },
          output: { result: 'Processing completed' },
          status: 'success',
          timestamp,
          executionTime: 500
        };
    }
  };

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'start':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
          </svg>
        );
      case 'agent':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="8" cy="8" r="2" fill="currentColor"/>
            <circle cx="16" cy="8" r="2" fill="currentColor"/>
            <circle cx="8" cy="16" r="2" fill="currentColor"/>
            <circle cx="16" cy="16" r="2" fill="currentColor"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>
        );
      case 'jira':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129V13.1a5.218 5.218 0 0 0 5.232-5.215V6.782a1.024 1.024 0 0 0-1.018-1.025zM23.013.592H11.455a5.215 5.215 0 0 0 5.215 5.214h2.129V7.863a5.218 5.218 0 0 0 5.232-5.215V1.617A1.024 1.024 0 0 0 23.013.592z"/>
          </svg>
        );
      case 'confluence':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.87 19.492c.494 1.516 1.528 2.594 3.01 3.14.49.18.995.252 1.528.22 1.51-.09 2.84-.99 3.61-2.45l4.75-9.03c1.21-2.3 3.99-3.19 6.29-1.98 2.3 1.21 3.19 3.99 1.98 6.29l-1.65 3.14c-.15.29-.03.65.26.8.29.15.65.03.8-.26l1.65-3.14c1.8-3.42.37-7.71-3.05-9.51-3.42-1.8-7.71-.37-9.51 3.05L4.77 18.832c-.54 1.02-1.47 1.65-2.53 1.71-.36.02-.71-.03-1.07-.15-1.04-.38-1.78-1.14-2.15-2.2-.15-.42-.05-.87.32-1.02.37-.15.83-.03.98.35zm22.26-14.98c-.49-1.516-1.528-2.594-3.01-3.14-.49-.18-.995-.252-1.528-.22-1.51.09-2.84.99-3.61 2.45l-4.75 9.03c-1.21 2.3-3.99 3.19-6.29 1.98-2.3-1.21-3.19-3.99-1.98-6.29l1.65-3.14c.15-.29.03-.65-.26-.8-.29-.15-.65-.03-.8.26l-1.65 3.14c-1.8 3.42-.37 7.71 3.05 9.51 3.42 1.8 7.71.37 9.51-3.05L19.23 5.168c.54-1.02 1.47-1.65 2.53-1.71.36-.02.71.03 1.07.15 1.04.38 1.78 1.14 2.15 2.2.15.42.05.87-.32 1.02-.37.15-.83.03-.98-.35z"/>
          </svg>
        );
      case 'end':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4l2.5 1.5a1 1 0 11-1 1.732L9 12.732V7a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Workflow Execution Results</h2>
              <p className="text-sm text-gray-500">Real-time execution monitoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Execution Progress */}
        {isExecuting && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">
                Executing workflow... Step {currentStep + 1} of {nodes.length}
              </span>
            </div>
          </div>
        )}

        {/* Chat-like Execution Steps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {executionSteps.length === 0 && !isExecuting && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <p className="text-gray-500">Click "Start Execution" to begin workflow execution</p>
            </div>
          )}

          {executionSteps.map((step, index) => (
            <div key={step.nodeId} className="flex space-x-4">
              {/* Node Icon */}
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === 'success' ? 'bg-green-100 text-green-600' :
                  step.status === 'error' ? 'bg-red-100 text-red-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {getNodeIcon(step.nodeType)}
                </div>
              </div>

              {/* Chat Bubble */}
              <div className="flex-1 max-w-3xl">
                {/* Node Header */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">{step.nodeName}</span>
                  <span className="text-xs text-gray-500">({step.nodeType})</span>
                  <span className="text-xs text-gray-400">{step.timestamp}</span>
                  {step.executionTime && (
                    <span className="text-xs text-blue-600">+{step.executionTime}ms</span>
                  )}
                </div>

                {/* Input Bubble */}
                <div className="mb-3">
                  <div className="inline-block max-w-full">
                    <div className="bg-blue-100 rounded-lg rounded-bl-none px-4 py-3">
                      <div className="text-xs font-medium text-blue-800 mb-1">Input</div>
                      <pre className="text-sm text-blue-900 whitespace-pre-wrap break-words">
                        {JSON.stringify(step.input, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Output Bubble */}
                <div>
                  <div className="inline-block max-w-full">
                    <div className={`rounded-lg rounded-br-none px-4 py-3 ${
                      step.status === 'success' ? 'bg-green-100' :
                      step.status === 'error' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      <div className={`text-xs font-medium mb-1 ${
                        step.status === 'success' ? 'text-green-800' :
                        step.status === 'error' ? 'text-red-800' :
                        'text-gray-800'
                      }`}>Output</div>
                      <pre className={`text-sm whitespace-pre-wrap break-words ${
                        step.status === 'success' ? 'text-green-900' :
                        step.status === 'error' ? 'text-red-900' :
                        'text-gray-900'
                      }`}>
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Current executing step indicator */}
          {isExecuting && currentStep >= 0 && currentStep < nodes.length && (
            <div className="flex space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center animate-pulse">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-blue-600 animate-pulse">
                  Executing: {nodes[currentStep]?.data.label}...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {executionSteps.length > 0 && (
              <span>Executed {executionSteps.length} of {nodes.length} steps</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={simulateExecution}
              disabled={isExecuting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? 'Executing...' : 'Start Execution'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionResultModal; 