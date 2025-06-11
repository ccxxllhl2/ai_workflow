import React, { useMemo, useCallback } from 'react';
import { ExecutionStatus } from '../../types/workflow';

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
  workflowNodes?: any[];
  currentNode?: string | null;
  executionStatus?: ExecutionStatus | null;
  isLoading?: boolean;
  layout?: 'vertical' | 'horizontal';
  onContinueExecution?: () => void;
}

const NodeExecutionList: React.FC<NodeExecutionListProps> = ({
  executionHistory,
  workflowNodes = [],
  currentNode,
  executionStatus,
  isLoading = false,
  layout = 'horizontal',
  onContinueExecution
}) => {
  // 合并工作流节点和执行历史，创建完整的节点列表（保持执行顺序）
  const allNodes = useMemo(() => {
    if (workflowNodes.length > 0) {
      // 如果有工作流节点信息，按照工作流节点的顺序进行处理
      return workflowNodes.map(node => {
        const nodeInfo = {
          id: node.id,
          name: node.data?.label || node.data?.config?.label || node.id, // 优先获取节点标签
          type: node.type,
          status: 'pending' as 'pending' | 'running' | 'completed' | 'failed' | 'paused' // 默认状态
        };
        
        // 从执行历史中获取该节点的状态信息
        const executionItem = executionHistory.find(item => item.node_id === node.id);
        if (executionItem) {
          nodeInfo.status = executionItem.status;
          // 如果执行历史中有节点名称，也要更新（但保持优先级）
          if (executionItem.node_name && !nodeInfo.name.includes('node_')) {
            nodeInfo.name = executionItem.node_name;
          }
        } else {
          // 如果没有执行历史记录，但该节点在当前节点之前，且执行状态不是PENDING，则认为已完成
          const nodeIndex = workflowNodes.findIndex(n => n.id === node.id);
          const currentNodeIndex = workflowNodes.findIndex(n => n.id === currentNode);
          
          if (currentNodeIndex >= 0 && nodeIndex >= 0 && nodeIndex < currentNodeIndex && 
              executionStatus !== ExecutionStatus.PENDING) {
            nodeInfo.status = 'completed';
          }
        }
        
        return nodeInfo;
      });
    } else {
      // 如果没有工作流节点信息，从执行历史推断（回退机制）
      const nodeMap: Record<string, any> = {};
      executionHistory.forEach(item => {
        nodeMap[item.node_id] = {
          id: item.node_id,
          name: item.node_name || item.node_id,
          type: item.node_type,
          status: item.status
        };
      });
      return Object.values(nodeMap);
    }
  }, [workflowNodes, executionHistory, currentNode, executionStatus]);

  const nodeIds = useMemo(() => allNodes.map(node => node.id), [allNodes]);
  
  // 创建节点状态映射
  const nodeStatusMap = useMemo(() => {
    const statusMap: Record<string, any> = {};
    allNodes.forEach(node => {
      statusMap[node.id] = node;
    });
    return statusMap;
  }, [allNodes]);

  // 根据节点类型获取配色方案
  const getNodeTypeColor = useCallback((nodeType: string) => {
    switch (nodeType) {
      case 'agent':
        return {
          bg: 'from-purple-50 to-purple-100',
          border: 'border-purple-200',
          activeBg: 'from-purple-100 to-purple-200',
          activeBorder: 'border-purple-400',
          text: 'text-purple-900'
        };
      case 'human_control':
        return {
          bg: 'from-amber-50 to-amber-100',
          border: 'border-amber-200',
          activeBg: 'from-amber-100 to-amber-200',
          activeBorder: 'border-amber-400',
          text: 'text-amber-900'
        };
      case 'start':
        return {
          bg: 'from-emerald-50 to-emerald-100',
          border: 'border-emerald-200',
          activeBg: 'from-emerald-100 to-emerald-200',
          activeBorder: 'border-emerald-400',
          text: 'text-emerald-900'
        };
      case 'code':
        return {
          bg: 'from-blue-50 to-blue-100',
          border: 'border-blue-200',
          activeBg: 'from-blue-100 to-blue-200',
          activeBorder: 'border-blue-400',
          text: 'text-blue-900'
        };
      case 'end':
        return {
          bg: 'from-red-50 to-red-100',
          border: 'border-red-200',
          activeBg: 'from-red-100 to-red-200',
          activeBorder: 'border-red-400',
          text: 'text-red-900'
        };
      default:
        return {
          bg: 'from-gray-50 to-gray-100',
          border: 'border-gray-200',
          activeBg: 'from-gray-100 to-gray-200',
          activeBorder: 'border-gray-400',
          text: 'text-gray-900'
        };
    }
  }, []);

  const getNodeStatusIcon = (nodeId: string) => {
    const nodeData = nodeStatusMap[nodeId];
    
    // 优先检查节点是否已完成
    if (nodeData && nodeData.status === 'completed') {
      return (
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
      );
    }
    
    // 检查是否为当前节点
    if (nodeId === currentNode) {
      if (executionStatus === ExecutionStatus.PAUSED) {
        return (
          <div className="relative">
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
            </div>
            <div className="absolute inset-0 w-5 h-5 bg-orange-400 rounded-full animate-pulse opacity-50"></div>
          </div>
        );
      } else if (executionStatus === ExecutionStatus.RUNNING) {
        return (
          <div className="relative">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
            </div>
            <div className="absolute inset-0 w-5 h-5 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          </div>
        );
      }
    }

    // 检查是否在当前节点之前（基于工作流顺序）
    if (workflowNodes.length > 0 && currentNode) {
      const nodeIndex = workflowNodes.findIndex(node => node.id === nodeId);
      const currentIndex = workflowNodes.findIndex(node => node.id === currentNode);
      
      if (nodeIndex >= 0 && currentIndex >= 0 && nodeIndex < currentIndex) {
        return (
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </div>
        );
      }
    }

    // 默认为未运行状态
    return (
      <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
        <div className="w-2.5 h-2.5 bg-gray-500 rounded-full"></div>
      </div>
    );
  };

  // 检查是否需要显示继续按钮
  const shouldShowContinueButton = useCallback((nodeId: string) => {
    const nodeData = nodeStatusMap[nodeId];
    return nodeId === currentNode && 
           executionStatus === ExecutionStatus.PAUSED && 
           nodeData?.type === 'human_control' &&
           onContinueExecution;
  }, [currentNode, executionStatus, nodeStatusMap, onContinueExecution]);

  const getNodeDisplayName = useCallback((nodeId: string) => {
    const nodeData = nodeStatusMap[nodeId];
    // 优先返回节点的名称，如果没有则返回ID
    return nodeData?.name || nodeData?.node_name || nodeId;
  }, [nodeStatusMap]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <h2 className="text-lg font-bold flex items-center space-x-2">
            <span>🔄</span>
            <span>Node Execution Status</span>
          </h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">⚡</div>
            <p className="text-gray-600">Loading execution status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (nodeIds.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
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
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <h2 className="text-lg font-bold flex items-center space-x-2">
          <span>🔄</span>
          <span>Node Execution Status</span>
        </h2>
        <p className="text-indigo-100 mt-1 text-sm">
          {executionStatus === ExecutionStatus.RUNNING ? `Workflow is running... (Current: ${currentNode ? getNodeDisplayName(currentNode) : 'Unknown'})` : 
           executionStatus === ExecutionStatus.PAUSED ? `Workflow is paused at: ${currentNode ? getNodeDisplayName(currentNode) : 'Unknown'}` :
           executionStatus === ExecutionStatus.COMPLETED ? 'Workflow completed' :
           executionStatus === ExecutionStatus.FAILED ? 'Workflow failed' : 'Ready to execute'}
        </p>
      </div>
      
      <div className="p-6">
        {layout === 'horizontal' ? (
          // Horizontal Layout - Grid of cards
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {nodeIds.map((nodeId, index) => {
              const nodeData = nodeStatusMap[nodeId];
              const isCurrentNode = nodeId === currentNode;
              const typeColors = getNodeTypeColor(nodeData?.type || 'default');
              
              return (
                <div
                  key={nodeId}
                  className={`relative p-3 rounded-lg transition-all duration-300 ${
                    isCurrentNode 
                      ? `bg-gradient-to-br ${typeColors.activeBg} border-2 ${typeColors.activeBorder} shadow-md` 
                      : nodeData?.status === 'completed'
                      ? 'bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200'
                      : `bg-gradient-to-br ${typeColors.bg} border ${typeColors.border}`
                  }`}
                >
                  {/* Execution Order Badge */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  
                  {/* Status Icon */}
                  <div className="flex justify-center mb-2">
                    {getNodeStatusIcon(nodeId)}
                  </div>

                  {/* Node Name */}
                  <div className="text-center mb-2">
                    <h3 className={`font-medium text-xs truncate ${
                      isCurrentNode ? typeColors.text : 'text-gray-900'
                    }`}>
                      {getNodeDisplayName(nodeId)}
                    </h3>
                  </div>

                  {/* Continue Button for Human Control Nodes */}
                  {shouldShowContinueButton(nodeId) && (
                    <div className="text-center">
                      <button
                        onClick={onContinueExecution}
                        className="px-2 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors duration-200 flex items-center space-x-1 mx-auto"
                      >
                        <span>▶️</span>
                        <span>继续</span>
                      </button>
                    </div>
                  )}

                  {/* Connection Arrow to Next Node */}
                  {index < nodeIds.length - 1 && (
                    <div className="absolute -right-1.5 top-1/2 transform -translate-y-1/2 z-10">
                      <div className={`w-3 h-0.5 ${
                        nodeData?.status === 'completed' ? 'bg-green-400' :
                        nodeId === currentNode ? 'bg-blue-400' : 'bg-gray-300'
                      } transition-colors duration-500`}></div>
                      <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-0.5 w-0 h-0 border-l-2 border-t border-b ${
                        nodeData?.status === 'completed' ? 'border-l-green-400 border-t-transparent border-b-transparent' :
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
              const typeColors = getNodeTypeColor(nodeData?.type || 'default');
              
              return (
                <div key={nodeId} className="flex flex-col">
                  <div className={`p-3 rounded-lg transition-all duration-300 ${
                    isCurrentNode 
                      ? `bg-gradient-to-r ${typeColors.activeBg} border-2 ${typeColors.activeBorder} shadow-md` 
                      : nodeData?.status === 'completed'
                      ? 'bg-green-50 border border-green-200'
                      : `bg-gradient-to-r ${typeColors.bg} border ${typeColors.border}`
                  }`}>
                    
                    <div className="flex items-center space-x-3">
                      {/* Execution Order */}
                      <div className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>

                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {getNodeStatusIcon(nodeId)}
                      </div>

                      {/* Node Name */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-sm truncate ${
                          isCurrentNode ? typeColors.text : 'text-gray-900'
                        }`}>
                          {getNodeDisplayName(nodeId)}
                        </h3>
                      </div>
                    </div>

                    {/* Continue Button for Human Control Nodes */}
                    {shouldShowContinueButton(nodeId) && (
                      <div className="mt-3 text-center">
                        <button
                          onClick={onContinueExecution}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors duration-200 flex items-center space-x-1 mx-auto"
                        >
                          <span>▶️</span>
                          <span>继续执行</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Connection Line */}
                  {index < nodeIds.length - 1 && (
                    <div className={`w-0.5 h-4 ${
                      nodeData?.status === 'completed' ? 'bg-green-400' :
                      nodeId === currentNode ? 'bg-blue-400' : 'bg-gray-300'
                    } mx-auto transition-colors duration-500`}></div>
                  )}
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