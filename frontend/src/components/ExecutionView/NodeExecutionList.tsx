import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ExecutionStatus, WorkflowNode } from '../../types/workflow';

interface NodeExecutionItem {
  node_id: string;
  node_name?: string;
  node_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  started_at?: string;
  completed_at?: string;
  duration?: number;
  error_message?: string;
  variables_snapshot?: Record<string, any>;
}

interface NodeExecutionListProps {
  executionHistory: NodeExecutionItem[];
  currentNode?: string | null;
  executionStatus?: ExecutionStatus | null;
  isLoading?: boolean;
  layout?: 'vertical' | 'horizontal';
  workflowNodes?: WorkflowNode[];
}

const NodeExecutionList: React.FC<NodeExecutionListProps> = ({
  executionHistory,
  currentNode,
  executionStatus,
  isLoading = false,
  layout = 'horizontal',
  workflowNodes = []
}) => {
  const [animatingNode, setAnimatingNode] = useState<string | null>(null);

  // Memoize the node status map to prevent unnecessary re-renders
  const nodeStatusMap = useMemo(() => {
    const statusMap: Record<string, NodeExecutionItem> = {};
    
    // Add all nodes from history
    executionHistory.forEach(item => {
      statusMap[item.node_id] = item;
    });

    return statusMap;
  }, [executionHistory]);

  // Generate ordered node IDs from workflow nodes, fallback to execution history
  const nodeIds = useMemo(() => {
    if (workflowNodes && workflowNodes.length > 0) {
      // Use workflow node order
      return workflowNodes.map(node => node.id);
    } else {
      // Fallback to execution history order
      return Object.keys(nodeStatusMap);
    }
  }, [workflowNodes, nodeStatusMap]);

  // Trigger animation when current node changes
  useEffect(() => {
    if (currentNode && executionStatus === ExecutionStatus.RUNNING) {
      setAnimatingNode(currentNode);
      const timer = setTimeout(() => setAnimatingNode(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentNode, executionStatus]);

  const getNodeStatusIcon = (nodeId: string) => {
    const nodeData = nodeStatusMap[nodeId];
    
    // Current active node with special handling
    if (nodeId === currentNode) {
      switch (executionStatus) {
        case ExecutionStatus.RUNNING:
          return (
            <div className="relative">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-60"></div>
            </div>
          );
        case ExecutionStatus.PAUSED:
          return (
            <div className="relative">
              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-1 h-2 bg-white rounded-sm"></div>
              </div>
              <div className="absolute inset-0 w-4 h-4 bg-orange-400 rounded-full animate-pulse opacity-60"></div>
            </div>
          );
        default:
          return (
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          );
      }
    }

    // Nodes without execution data start in gray state (initial state)
    if (!nodeData) {
      return (
        <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      );
    }

    // Color restoration for nodes as they execute
    switch (nodeData.status) {
      case 'completed':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </div>
        );
      case 'paused':
        return (
          <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
        );
      case 'running':
        return (
          <div className="relative">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-60"></div>
          </div>
        );
      case 'pending':
        return (
          <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        );
      default:
        // Default gray state for unknown status
        return (
          <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        );
    }
  };

  const getConnectionLine = (index: number, isLast: boolean) => {
    if (isLast) return null;

    const currentNodeData = nodeStatusMap[nodeIds[index]];
    const nextNodeData = nodeStatusMap[nodeIds[index + 1]];
    
    let lineColor = 'bg-gray-300';
    
    if (currentNodeData?.status === 'completed' && nextNodeData) {
      lineColor = 'bg-green-400';
    } else if (currentNodeData?.status === 'failed') {
      lineColor = 'bg-red-400';
    } else if (nodeIds[index] === currentNode) {
      lineColor = 'bg-blue-400';
    }

    return (
      <div className={`w-0.5 h-6 ${lineColor} mx-auto transition-colors duration-500`}></div>
    );
  };

  const formatDuration = useCallback((duration?: number) => {
    if (!duration) return '';
    if (duration < 60) return `${duration.toFixed(1)}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = (duration % 60).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }, []);

  const getNodeDisplayName = useCallback((nodeId: string) => {
    const nodeData = nodeStatusMap[nodeId];
    const workflowNode = workflowNodes.find(node => node.id === nodeId);
    return nodeData?.node_name || workflowNode?.data?.label || nodeId;
  }, [nodeStatusMap, workflowNodes]);

  const getNodeType = useCallback((nodeId: string) => {
    const nodeData = nodeStatusMap[nodeId];
    const workflowNode = workflowNodes.find(node => node.id === nodeId);
    return nodeData?.node_type || workflowNode?.type || 'Unknown';
  }, [nodeStatusMap, workflowNodes]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <h2 className="text-lg font-bold flex items-center space-x-2">
            <span>🔄</span>
            <span>Node Execution Status</span>
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔄</div>
            <p className="text-gray-600">Loading execution status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (nodeIds.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <h2 className="text-lg font-bold flex items-center space-x-2">
            <span>🔄</span>
            <span>Node Execution Status</span>
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p>No execution data available</p>
            <p className="text-sm mt-2">Start workflow execution to see node status</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <h2 className="text-lg font-bold flex items-center space-x-2">
          <span>🔄</span>
          <span>Node Execution Status</span>
        </h2>
        <p className="text-indigo-100 mt-1 text-sm">
          {executionStatus === ExecutionStatus.RUNNING ? 'Workflow is running...' : 
           executionStatus === ExecutionStatus.PAUSED ? 'Workflow is paused' :
           executionStatus === ExecutionStatus.COMPLETED ? 'Workflow completed' :
           executionStatus === ExecutionStatus.FAILED ? 'Workflow failed' : 'Ready to execute'}
        </p>
      </div>
      
      <div className="p-6">
        {layout === 'horizontal' ? (
          // Horizontal Layout - Grid of cards
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {nodeIds.map((nodeId, index) => {
              const nodeData = nodeStatusMap[nodeId];
              const isCurrentNode = nodeId === currentNode;
              const isAnimating = nodeId === animatingNode;
              
              return (
                <div
                  key={nodeId}
                  className={`relative p-4 rounded-xl transition-all duration-300 ${
                    isCurrentNode 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 shadow-lg transform scale-105' 
                      : nodeData?.status === 'completed'
                      ? 'bg-gradient-to-br from-green-50 to-emerald-100 border border-green-300'
                      : nodeData?.status === 'failed'
                      ? 'bg-gradient-to-br from-red-50 to-red-100 border border-red-300'
                      : nodeData?.status === 'paused'
                      ? 'bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-300'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300'
                  } ${isAnimating ? 'animate-pulse' : ''}`}
                >
                  {/* Execution Order Badge */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  
                  {/* Node Info */}
                  <div className="text-center">
                    <h3 className={`font-medium text-sm mb-2 truncate ${
                      isCurrentNode ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {getNodeDisplayName(nodeId)}
                    </h3>
                    
                    {/* Status Icon and Text in same row */}
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="flex-shrink-0">
                        {getNodeStatusIcon(nodeId)}
                      </div>
                      {nodeData?.status && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          nodeData.status === 'completed' ? 'bg-green-200 text-green-800' :
                          nodeData.status === 'failed' ? 'bg-red-200 text-red-800' :
                          nodeData.status === 'paused' ? 'bg-orange-200 text-orange-800' :
                          nodeData.status === 'running' ? 'bg-blue-200 text-blue-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {nodeData.status}
                        </span>
                      )}
                    </div>

                    {nodeData?.duration && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                          {formatDuration(nodeData.duration)}
                        </span>
                      </div>
                    )}

                    {/* Current Node Indicator */}
                    {isCurrentNode && executionStatus === ExecutionStatus.RUNNING && (
                      <div className="mt-2 flex items-center justify-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600 font-medium">Running</span>
                      </div>
                    )}

                    {isCurrentNode && executionStatus === ExecutionStatus.PAUSED && (
                      <div className="mt-2 flex items-center justify-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        <span className="text-xs text-orange-600 font-medium">Waiting</span>
                      </div>
                    )}

                    {/* Error Message */}
                    {nodeData?.error_message && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700 text-left">
                        {nodeData.error_message.length > 50 
                          ? `${nodeData.error_message.substring(0, 50)}...` 
                          : nodeData.error_message}
                      </div>
                    )}
                  </div>

                  {/* Connection Arrow to Next Node */}
                  {index < nodeIds.length - 1 && (
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 z-10">
                      <div className={`w-4 h-0.5 ${
                        nodeData?.status === 'completed' ? 'bg-green-400' :
                        nodeData?.status === 'failed' ? 'bg-red-400' :
                        nodeId === currentNode ? 'bg-blue-400' : 'bg-gray-300'
                      } transition-colors duration-500`}></div>
                      <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-0.5 w-0 h-0 border-l-2 border-t border-b ${
                        nodeData?.status === 'completed' ? 'border-l-green-400 border-t-transparent border-b-transparent' :
                        nodeData?.status === 'failed' ? 'border-l-red-400 border-t-transparent border-b-transparent' :
                        nodeId === currentNode ? 'border-l-blue-400 border-t-transparent border-b-transparent' : 
                        'border-l-gray-300 border-t-transparent border-b-transparent'
                      } transition-colors duration-500`}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Vertical Layout - Original list view
          <div className="max-h-96 overflow-y-auto">
            {nodeIds.map((nodeId, index) => {
              const nodeData = nodeStatusMap[nodeId];
              const isCurrentNode = nodeId === currentNode;
              const isAnimating = nodeId === animatingNode;
              
              return (
                <div key={nodeId} className="flex flex-col">
                  <div className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-300 ${
                    isCurrentNode 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md transform scale-105' 
                      : nodeData?.status === 'completed'
                      ? 'bg-green-50 border border-green-200'
                      : nodeData?.status === 'failed'
                      ? 'bg-red-50 border border-red-200'
                      : nodeData?.status === 'paused'
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-gray-50 border border-gray-200'
                  } ${isAnimating ? 'animate-pulse' : ''}`}>
                    
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {getNodeStatusIcon(nodeId)}
                    </div>

                    {/* Node Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium truncate ${
                          isCurrentNode ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {getNodeDisplayName(nodeId)}
                        </h3>
                        {nodeData?.duration && (
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                            {formatDuration(nodeData.duration)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gray-600 capitalize">
                          {getNodeType(nodeId)}
                        </span>
                        
                        {nodeData?.status && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            nodeData.status === 'completed' ? 'bg-green-100 text-green-800' :
                            nodeData.status === 'failed' ? 'bg-red-100 text-red-800' :
                            nodeData.status === 'paused' ? 'bg-orange-100 text-orange-800' :
                            nodeData.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {nodeData.status}
                          </span>
                        )}
                      </div>

                      {/* Error Message */}
                      {nodeData?.error_message && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                          {nodeData.error_message}
                        </div>
                      )}

                      {/* Current Node Indicator */}
                      {isCurrentNode && executionStatus === ExecutionStatus.RUNNING && (
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-blue-600 font-medium">Currently executing...</span>
                        </div>
                      )}

                      {isCurrentNode && executionStatus === ExecutionStatus.PAUSED && (
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-xs text-orange-600 font-medium">Waiting for input...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connection Line */}
                  {getConnectionLine(index, index === nodeIds.length - 1)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(NodeExecutionList); 