import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Execution, ExecutionStatus } from '../../types/workflow';
import { executionApi, workflowApi } from '../../services/api';
import NodeExecutionList from './NodeExecutionList';
import { extractVariablesFromNodes } from '../../utils/variableExtractor';

interface ExecutionViewProps {
  workflowId?: number;
  onReturnToEditor?: () => void;
}

interface FinalOutput {
  execution_id: number;
  final_output: any;
  has_output: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  node_name?: string;
  node_type?: string;
}

// Variable edit modal component
const VariableEditModal: React.FC<{
  variableKey: string;
  variableValue: any;
  onSave: (key: string, value: any) => void;
  onClose: () => void;
}> = ({ variableKey, variableValue, onSave, onClose }) => {
  const [value, setValue] = useState(String(variableValue));

  const handleSave = () => {
    let parsedValue: any = value;
    if (!isNaN(Number(value)) && value.trim() !== '') {
      parsedValue = Number(value);
    } else if (value.toLowerCase() === 'true') {
      parsedValue = true;
    } else if (value.toLowerCase() === 'false') {
      parsedValue = false;
    }
    onSave(variableKey, parsedValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Edit Variable: {variableKey}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variable Value
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              rows={8}
              placeholder={`Enter value for ${variableKey}...`}
              autoFocus
            />
            <div className="mt-2 text-xs text-gray-500">
              Current type: {typeof variableValue} | Type will be auto-detected
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const ExecutionView: React.FC<ExecutionViewProps> = ({ workflowId, onReturnToEditor }) => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [finalOutput, setFinalOutput] = useState<FinalOutput | null>(null);
  const [, setLoadingFinalOutput] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentPollingId, setCurrentPollingId] = useState<number | null>(null);
  const [lastHistoryUpdateTime, setLastHistoryUpdateTime] = useState<number>(0);
  const [workflowNodes, setWorkflowNodes] = useState<any[]>([]);
  const [workflowEdges, setWorkflowEdges] = useState<any[]>([]);
  const [isLiveUpdating, setIsLiveUpdating] = useState<boolean>(false);
  const [lastMessageCount, setLastMessageCount] = useState<number>(0);
  
  // Chat related state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [executionVariables, setExecutionVariables] = useState<Record<string, any>>({});
  const [workflowDefinedVariables, setWorkflowDefinedVariables] = useState<Record<string, any>>({});
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [editingVariable, setEditingVariable] = useState<{key: string, value: any} | null>(null);
  const [canSubmitInput, setCanSubmitInput] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadExecutions = useCallback(async () => {
    if (!workflowId) return;
    try {
      setLoading(true);
      const data = await executionApi.getExecutions(workflowId);
      setExecutions(data);
      setError(null);
      
      // 如果没有选中的执行记录且有可用的执行记录，选择最新的
      if (data.length > 0 && !selectedExecution) {
        const latestExecution = data[0];
        setSelectedExecution(latestExecution);
      }
    } catch (err) {
      setError('Failed to load execution records');
      console.error('Failed to load execution records:', err);
    } finally {
      setLoading(false);
    }
  }, [workflowId, selectedExecution]);

  const loadFinalOutput = useCallback(async (executionId: number) => {
    try {
      setLoadingFinalOutput(true);
      const output = await executionApi.getFinalOutput(executionId);
      setFinalOutput(output);
    } catch (err) {
      console.error('Failed to load final output:', err);
      setFinalOutput(null);
    } finally {
      setLoadingFinalOutput(false);
    }
  }, []);

  const convertHistoryToChatMessages = useCallback((history: any[]) => {
    const messages: ChatMessage[] = [];
    
    history.forEach((item) => {
      // 只为 agent 和 human_control 节点添加执行开始消息
      if (item.node_type === 'agent' || item.node_type === 'human_control') {
        messages.push({
          role: 'system',
          content: `Started executing: ${item.node_name || item.node_id} (${item.node_type})`,
          timestamp: new Date(item.started_at),
          node_name: item.node_name,
          node_type: item.node_type
        });
      }

      // Add agent conversation - 检查多种可能的字段名称
      if (item.node_type === 'agent') {
        // 检查不同的字段名称可能性
        const prompt = item.agent_prompt || item.prompt || item.input;
        const response = item.agent_response || item.response || item.output;
        
        if (prompt && response) {
          messages.push({
            role: 'user',
            content: prompt,
            timestamp: new Date(item.started_at),
            node_name: item.node_name,
            node_type: item.node_type
          });
          
          messages.push({
            role: 'assistant',
            content: response,
            timestamp: new Date(item.started_at),
            node_name: item.node_name,
            node_type: item.node_type
          });
        } else {
          // 如果没有对话数据，至少显示节点执行完成信息
          if (item.completed_at) {
            const output = item.output || item.agent_response || 'Agent completed execution';
            messages.push({
              role: 'system',
              content: `Agent completed: ${output}`,
              timestamp: new Date(item.completed_at),
              node_name: item.node_name,
              node_type: item.node_type
            });
          }
        }
      }

      // Add human control chat history
      if (item.node_type === 'human_control' && item.chat_history) {
        item.chat_history.forEach((chat: any) => {
          messages.push({
            role: chat.role === 'user' ? 'user' : 'assistant',
            content: chat.content,
            timestamp: new Date(chat.timestamp),
            node_name: item.node_name,
            node_type: item.node_type
          });
        });
      }

      // 只为非agent节点添加完成消息（agent节点在上面单独处理）
      if (item.completed_at && item.node_type !== 'agent') {
        const output = item.output || item.error_message;
        if (output && 
            !output.includes('executed successfully') && 
            !output.includes('paused for human intervention') &&
            output !== 'No output' &&
            output.trim() !== '') {
          messages.push({
            role: 'system',
            content: `Completed: ${output}`,
            timestamp: new Date(item.completed_at),
            node_name: item.node_name,
            node_type: item.node_type
          });
        }
      }
    });

    setChatMessages(messages);
  }, []);

  const loadExecutionHistory = useCallback(async (executionId: number, forceUpdate = false, isLiveUpdate = false) => {
    const now = Date.now();
    if (!forceUpdate && !isLiveUpdate && now - lastHistoryUpdateTime < 2000) {
      return;
    }
    
    try {
      if (!isLiveUpdate) {
        setLoadingHistory(true);
      }
      
      const response = await executionApi.getExecutionHistory(executionId);
      const newHistory = response.history;
      
      // 检查是否有新数据
      if (isLiveUpdate && executionHistory.length > 0) {
        const hasNewData = newHistory.length !== executionHistory.length || 
          JSON.stringify(newHistory) !== JSON.stringify(executionHistory);
        
        if (hasNewData) {
          setExecutionHistory(newHistory);
          convertHistoryToChatMessages(newHistory);
          setLastHistoryUpdateTime(now);
        }
      } else {
        setExecutionHistory(newHistory);
        convertHistoryToChatMessages(newHistory);
        setLastHistoryUpdateTime(now);
      }
    } catch (err) {
      console.error('Failed to load execution history:', err);
      if (!isLiveUpdate) {
        setExecutionHistory([]);
      }
    } finally {
      if (!isLiveUpdate) {
        setLoadingHistory(false);
      }
    }
  }, [lastHistoryUpdateTime, convertHistoryToChatMessages, executionHistory]);

  const loadVariables = useCallback(async (executionId: number) => {
    try {
      const data = await executionApi.getExecutionVariables(executionId);
      setExecutionVariables(data.variables);
    } catch (err) {
      console.error('Failed to load execution variables:', err);
      setExecutionVariables({});
    }
  }, []);
  
  // 提取工作流定义的变量
  const extractWorkflowDefinedVariables = useCallback(() => {
    if (workflowNodes.length === 0) return {};
    
    const definedVariables: Record<string, any> = {};
    const extractedVars = extractVariablesFromNodes(workflowNodes);
    
    // 从Start节点提取初始变量
    extractedVars.forEach(variable => {
      if (variable.source === 'initial') {
        const startNode = workflowNodes.find(node => node.id === variable.nodeId);
        if (startNode && startNode.data?.config?.initialVariables) {
          try {
            const initialVars = JSON.parse(startNode.data.config.initialVariables);
            Object.assign(definedVariables, initialVars);
          } catch (err) {
            console.error('Failed to parse initial variables:', err);
          }
        }
      } else if (variable.source === 'output') {
        // 为输出变量设置默认值（如果执行变量中没有的话）
        definedVariables[variable.name] = definedVariables[variable.name] || null;
      }
    });
    
    return definedVariables;
  }, [workflowNodes]);
  
  // 合并所有变量
  useEffect(() => {
    const workflowVars = extractWorkflowDefinedVariables();
    setWorkflowDefinedVariables(workflowVars);
    
    // 合并工作流定义的变量和执行时的变量
    // 执行时的变量优先级更高（会覆盖默认值）
    const mergedVariables = { ...workflowVars, ...executionVariables };
    setVariables(mergedVariables);
  }, [workflowNodes, executionVariables, extractWorkflowDefinedVariables]);

  // 根据工作流的边信息计算节点的执行顺序
  const calculateExecutionOrder = useCallback((nodes: any[], edges: any[]) => {
    if (!nodes.length || !edges.length) {
      return nodes;
    }

    // 找到起始节点（没有入边的节点）
    const nodeIds = new Set(nodes.map(node => node.id));
    const nodesWithIncomingEdges = new Set(edges.map(edge => edge.target));
    const startNodes = nodes.filter(node => !nodesWithIncomingEdges.has(node.id));

    if (startNodes.length === 0) {
      console.warn('No start node found, using original order');
      return nodes;
    }

    // 构建邻接图
    const adjacencyMap = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!adjacencyMap.has(edge.source)) {
        adjacencyMap.set(edge.source, []);
      }
      adjacencyMap.get(edge.source)!.push(edge.target);
    });

    // 使用拓扑排序确定执行顺序
    const visited = new Set<string>();
    const result: any[] = [];
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId) || !nodeMap.has(nodeId)) {
        return;
      }
      
      visited.add(nodeId);
      result.push(nodeMap.get(nodeId)!);
      
      // 递归访问所有后续节点
      const nextNodes = adjacencyMap.get(nodeId) || [];
      nextNodes.forEach(nextNodeId => {
        dfs(nextNodeId);
      });
    };

    // 从所有起始节点开始遍历
    startNodes.forEach(startNode => {
      dfs(startNode.id);
    });

    // 添加任何未访问的节点（防止孤立节点丢失）
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        result.push(node);
      }
    });

    console.log('Calculated execution order:', result.map(node => node.id));
    return result;
  }, []);

  const loadWorkflowNodes = useCallback(async (workflowId: number) => {
    try {
      // 使用 workflowApi 而不是 fetch 来获取工作流详情
      const workflow = await workflowApi.getWorkflow(workflowId);
      if (workflow.config) {
        try {
          const config = JSON.parse(workflow.config);
          
          const nodes = config.nodes && Array.isArray(config.nodes) ? config.nodes : [];
          const edges = config.edges && Array.isArray(config.edges) ? config.edges : [];
          
          if (nodes.length > 0) {
            // 按执行顺序排序节点
            const orderedNodes = calculateExecutionOrder(nodes, edges);
            setWorkflowNodes(orderedNodes);
            setWorkflowEdges(edges);
            console.log('Loaded workflow nodes in execution order:', orderedNodes.map(n => ({id: n.id, label: n.data?.label})));
          } else {
            console.log('No nodes found in workflow config');
            setWorkflowNodes([]);
            setWorkflowEdges([]);
          }
        } catch (parseError) {
          console.error('Failed to parse workflow config:', parseError);
          setWorkflowNodes([]);
          setWorkflowEdges([]);
        }
      } else {
        console.log('No config found in workflow');
        setWorkflowNodes([]);
        setWorkflowEdges([]);
      }
    } catch (err) {
      console.error('Failed to load workflow nodes:', err);
      setWorkflowNodes([]);
      setWorkflowEdges([]);
    }
  }, [calculateExecutionOrder]);

  useEffect(() => {
    if (workflowId) {
      loadExecutions();
    }
  }, [workflowId, loadExecutions]);

  // 确保在页面初始加载时加载最新执行记录的数据
  useEffect(() => {
    if (executions.length > 0 && selectedExecution && !chatMessages.length && !loadingHistory) {
      console.log('Initial data load for execution:', selectedExecution.id);
      loadExecutionHistory(selectedExecution.id, true);
      loadFinalOutput(selectedExecution.id);
      loadVariables(selectedExecution.id);
    }
  }, [executions, selectedExecution, chatMessages.length, loadingHistory, loadExecutionHistory, loadFinalOutput, loadVariables]);

  const [lastExecutionId, setLastExecutionId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedExecution) {
      if (selectedExecution.id !== lastExecutionId) {
        loadFinalOutput(selectedExecution.id);
        loadExecutionHistory(selectedExecution.id, true);
        loadVariables(selectedExecution.id);
        setLastExecutionId(selectedExecution.id);
      }
    }
  }, [selectedExecution, lastExecutionId, loadFinalOutput, loadExecutionHistory, loadVariables]);

  useEffect(() => {
    if (workflowId) {
      loadWorkflowNodes(workflowId);
    }
  }, [workflowId, loadWorkflowNodes]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // 跟踪消息数量变化
    if (chatMessages.length > lastMessageCount) {
      setLastMessageCount(chatMessages.length);
    }
  }, [chatMessages, lastMessageCount]);

  useEffect(() => {
    setCanSubmitInput(
      selectedExecution?.status === ExecutionStatus.PAUSED &&
      executionHistory.some(item => 
        item.node_id === selectedExecution?.current_node && 
        item.node_type === 'human_control' &&
        !item.completed_at
      )
    );
  }, [selectedExecution?.status, selectedExecution?.current_node, executionHistory]);

  // 清理函数：组件卸载时停止所有轮询
  useEffect(() => {
    return () => {
      setCurrentPollingId(null);
      setIsLiveUpdating(false);
    };
  }, []);

  const handleExecuteWorkflow = async () => {
    if (!workflowId) return;
    try {
      const execution = await executionApi.executeWorkflow(workflowId);
      setExecutions([execution, ...executions]);
      setSelectedExecution(execution);
      setExecutionHistory([]);
      setFinalOutput(null);
      pollExecutionStatus(execution.id);
    } catch (err) {
      alert('Failed to start execution');
      console.error('Failed to start execution:', err);
    }
  };

  // 实时更新聊天历史的函数
  const startLiveUpdates = useCallback((executionId: number) => {
    if (isLiveUpdating) return;
    
    setIsLiveUpdating(true);
    
    const liveUpdateInterval = setInterval(async () => {
      try {
        await loadExecutionHistory(executionId, false, true);
        await loadVariables(executionId);
      } catch (err) {
        console.error('Live update failed:', err);
      }
    }, 2000); // 每2秒更新一次聊天历史
    
    return () => {
      clearInterval(liveUpdateInterval);
      setIsLiveUpdating(false);
    };
  }, [isLiveUpdating, loadExecutionHistory, loadVariables]);

  const pollExecutionStatus = async (executionId: number) => {
    if (currentPollingId === executionId) {
      return;
    }
    
    setCurrentPollingId(executionId);
    
    // 启动实时更新
    const stopLiveUpdates = startLiveUpdates(executionId);
    
    let pollCount = 0;
    
    const doPoll = async () => {
      try {
        const execution = await executionApi.getExecution(executionId);
        pollCount++;
        
        setExecutions(prev => {
          const existingExecution = prev.find(e => e.id === executionId);
          if (!existingExecution || 
              existingExecution.status !== execution.status || 
              existingExecution.current_node !== execution.current_node) {
            return prev.map(e => e.id === executionId ? execution : e);
          }
          return prev;
        });
        
        if (selectedExecution?.id === executionId) {
          if (selectedExecution.status !== execution.status || 
              selectedExecution.current_node !== execution.current_node ||
              selectedExecution.completed_at !== execution.completed_at) {
            setSelectedExecution(execution);
            // 当状态或当前节点发生变化时，立即更新执行历史和变量
            loadExecutionHistory(executionId, true);
            loadVariables(executionId);
          }
        }

        if (execution.status === ExecutionStatus.COMPLETED || 
            execution.status === ExecutionStatus.FAILED) {
          clearInterval(pollInterval);
          setCurrentPollingId(null);
          stopLiveUpdates && stopLiveUpdates();
          
          setExecutions(prev => {
            const existingExecution = prev.find(e => e.id === executionId);
            if (!existingExecution || existingExecution.status !== execution.status) {
              return prev.map(e => e.id === executionId ? execution : e);
            }
            return prev;
          });
          
          setSelectedExecution(prev => {
            if (prev?.id === executionId) {
              const updatedExecution = { ...prev, ...execution };
              setTimeout(() => {
                loadFinalOutput(executionId);
                loadExecutionHistory(executionId, true);
                loadVariables(executionId);
              }, 50);
              return updatedExecution;
            }
            return prev;
          });
          return;
        } else if (execution.status === ExecutionStatus.PAUSED) {
          if (selectedExecution?.id === executionId && selectedExecution?.status !== ExecutionStatus.PAUSED) {
            loadExecutionHistory(executionId, true);
          }
        }
        
        // 根据轮询次数调整下次轮询的时间间隔
        const nextInterval = pollCount < 10 ? 500 : 1000;
        setTimeout(doPoll, nextInterval);
        
      } catch (err) {
        console.error('Failed to get execution status:', err);
        clearInterval(pollInterval);
        setCurrentPollingId(null);
        stopLiveUpdates && stopLiveUpdates();
      }
    };
    
    // 立即执行第一次轮询
    const pollInterval = setTimeout(doPoll, 100);

    setTimeout(() => {
      clearInterval(pollInterval);
      setCurrentPollingId(null);
      stopLiveUpdates && stopLiveUpdates();
    }, 60000); // 延长到60秒
  };

  const handleDeleteExecution = async (executionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this execution record?')) {
      return;
    }

    try {
      await executionApi.deleteExecution(executionId);
      setExecutions(prev => prev.filter(exec => exec.id !== executionId));
      if (selectedExecution?.id === executionId) {
        setSelectedExecution(null);
        setFinalOutput(null);
      }
    } catch (err) {
      alert('Failed to delete execution record');
      console.error('Failed to delete execution record:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || chatLoading || !selectedExecution) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setChatLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await executionApi.chatWithQwen(selectedExecution.id, currentMessage);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat failed:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, chat service is temporarily unavailable. Please try again later.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleVariableEdit = (key: string, value: any) => {
    setEditingVariable({ key, value });
  };

  const handleVariableSave = (key: string, value: any) => {
    // 更新合并后的变量列表
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
    
    // 如果这是执行时的变量，也要更新执行变量列表
    if (key in executionVariables) {
      setExecutionVariables(prev => ({
        ...prev,
        [key]: value
      }));
    }
    // 如果这是工作流定义的变量，也要更新工作流变量列表
    else if (key in workflowDefinedVariables) {
      setWorkflowDefinedVariables(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleContinueExecution = async () => {
    if (!selectedExecution || continueLoading) return;

    setContinueLoading(true);
    
    try {
      // 记录当前节点，用于立即更新状态
      const previousNode = selectedExecution.current_node;
      
      // 找到下一个节点，用于立即更新UI
      let nextNode = null;
      if (previousNode && workflowNodes.length > 0) {
        const currentIndex = workflowNodes.findIndex(node => node.id === previousNode);
        if (currentIndex >= 0 && currentIndex < workflowNodes.length - 1) {
          nextNode = workflowNodes[currentIndex + 1].id;
        }
      }
      
      // 立即更新执行历史，将当前human_control节点标记为完成
      if (previousNode) {
        setExecutionHistory(prev => {
          const updated = prev.map(item => 
            item.node_id === previousNode && item.node_type === 'human_control'
              ? { ...item, status: 'completed' as const, completed_at: new Date().toISOString() }
              : item
          );
          
          // 如果之前没有该节点的历史记录，创建一个
          const hasRecord = updated.some(item => item.node_id === previousNode);
          if (!hasRecord) {
            updated.push({
              node_id: previousNode,
              node_name: previousNode,
              node_type: 'human_control',
              status: 'completed',
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              duration: 0
            });
          }
          
          return updated;
        });
      }
      
      // 立即更新当前节点到下一个节点，使UI能立即反映变化
      if (nextNode) {
        setSelectedExecution(prev => prev ? {
          ...prev,
          current_node: nextNode,
          status: ExecutionStatus.RUNNING
        } : prev);
      }
      
      // 调用继续执行API，传入当前所有变量（合并工作流定义的和执行时的）
      await executionApi.continueExecution(selectedExecution.id, { variables });
      
      // 获取更新后的执行状态
      const updatedExecution = await executionApi.getExecution(selectedExecution.id);
      
      // 更新执行状态（确保与服务器状态同步）
      setSelectedExecution(updatedExecution);
      
      // 更新执行列表中的对应记录
      setExecutions(prev => prev.map(exec => 
        exec.id === selectedExecution.id ? updatedExecution : exec
      ));
      
      // 延迟刷新执行历史记录，确保后端状态已更新
      setTimeout(async () => {
        await loadExecutionHistory(updatedExecution.id, true);
      }, 500);
      
      // 如果执行状态变为运行中，立即开始轮询状态更新
      if (updatedExecution.status === ExecutionStatus.RUNNING) {
        // 立即进行一次状态检查，然后开始定期轮询
        setTimeout(() => {
          pollExecutionStatus(updatedExecution.id);
        }, 100);
      }
      
      console.log('Execution continued successfully', {
        executionId: selectedExecution.id,
        previousNode,
        nextNode,
        newStatus: updatedExecution.status,
        currentNode: updatedExecution.current_node
      });
      
    } catch (err) {
      console.error('Failed to continue execution:', err);
      alert(`继续执行失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setContinueLoading(false);
    }
  };

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ExecutionStatus.RUNNING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ExecutionStatus.PAUSED:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ExecutionStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case ExecutionStatus.FAILED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.PENDING:
        return '⏳';
      case ExecutionStatus.RUNNING:
        return '🔄';
      case ExecutionStatus.PAUSED:
        return '⏸️';
      case ExecutionStatus.COMPLETED:
        return '✅';
      case ExecutionStatus.FAILED:
        return '❌';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!workflowId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Workflow</h2>
          <p className="text-gray-600">Please select a workflow first to view execution records</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="animate-spin text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Getting execution records</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top Status Bar */}
      {selectedExecution && (
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(selectedExecution.status)}</span>
                  <div>
                    <span className="text-lg font-bold text-gray-800">Execution #{selectedExecution.id}</span>
                    <div className={`inline-block ml-3 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedExecution.status)}`}>
                      {selectedExecution.status}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Started: {formatDate(selectedExecution.started_at)}
                </div>
                {selectedExecution.current_node && (
                  <div className="text-sm text-blue-600 font-medium">
                    Current: {selectedExecution.current_node}
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                {onReturnToEditor && (
                  <button
                    onClick={onReturnToEditor}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                  >
                    <span>📋</span>
                    <span>Back to Workflow</span>
                  </button>
                )}
                <button
                  onClick={handleExecuteWorkflow}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <span>🚀</span>
                  <span>Start Execution</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-6">
        {!selectedExecution && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Execution Manager</h1>
            <div className="flex space-x-3">
              {onReturnToEditor && (
                <button
                  onClick={onReturnToEditor}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>Back to Workflow</span>
                </button>
              )}
              <button
                onClick={handleExecuteWorkflow}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <span>🚀</span>
                <span>Start Execution</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ minHeight: '800px' }}>
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Node Execution Status - Vertical */}
            <NodeExecutionList
              executionHistory={executionHistory}
              workflowNodes={workflowNodes}
              currentNode={selectedExecution?.current_node}
              executionStatus={selectedExecution?.status}
              isLoading={loadingHistory}
              layout="vertical"
              onContinueExecution={handleContinueExecution}
            />

            {/* Execution History List */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <h2 className="text-lg font-bold">Execution History</h2>
              </div>
              <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
                <div className="space-y-3">
                  {executions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-3xl mb-2">📝</div>
                      <p className="text-sm">No execution records yet</p>
                    </div>
                  ) : (
                    executions.map((execution) => (
                      <div
                        key={execution.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedExecution?.id === execution.id 
                            ? 'bg-blue-50 border-2 border-blue-300 shadow-md' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                        onClick={() => setSelectedExecution(execution)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getStatusIcon(execution.status)}</span>
                            <span className="font-bold text-sm">#{execution.id}</span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteExecution(execution.id, e)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Delete execution record"
                          >
                            🗑️
                          </button>
                        </div>
                        
                        <div className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(execution.status)}`}>
                          {execution.status}
                        </div>
                        
                        <div className="text-xs text-gray-600 mt-2">
                          {formatDate(execution.started_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Content - Workflow Execution Chat */}
          <div className="lg:col-span-3">
            {selectedExecution ? (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col" style={{ maxHeight: '1200px', height: 'fit-content' }}>
                <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Workflow Execution</h2>
                    <div className="flex items-center space-x-2">
                      {isLiveUpdating && (
                        <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs">Live</span>
                        </div>
                      )}
                      {selectedExecution?.status === ExecutionStatus.RUNNING && (
                        <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                          <span className="text-xs">Running</span>
                        </div>
                      )}
                      {selectedExecution?.status === ExecutionStatus.PAUSED && (
                        <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                          <span className="text-xs">Paused</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '900px' }}>
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">💬</div>
                      <p>No execution messages yet</p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'system' ? (
                          <div className="max-w-full">
                            <div className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm text-center">
                              <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                              <div>{message.content}</div>
                            </div>
                          </div>
                        ) : (
                          <div className={`max-w-md lg:max-w-2xl ${message.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                            <div className={`rounded-lg px-4 py-3 ${
                              message.role === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-800'
                            }`}>
                              <div className={`text-xs mb-1 ${
                                message.role === 'user' ? 'text-blue-100' : 'text-gray-600'
                              }`}>
                                {message.role === 'user' ? 'You' : 'AI Assistant'} - {formatTimestamp(message.timestamp)}
                              </div>
                              <div className="text-sm">{message.content}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {/* Live Update Indicator */}
                  {isLiveUpdating && selectedExecution?.status === ExecutionStatus.RUNNING && (
                    <div className="flex justify-start">
                      <div className="max-w-md lg:max-w-2xl mr-8">
                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="text-xs text-gray-500">AI is processing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Final Output Display */}
                  {finalOutput?.has_output && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-xl">✨</span>
                        <span className="font-medium text-green-800">Final Output</span>
                      </div>
                      <div className="bg-white p-3 rounded border font-mono text-sm">
                        {typeof finalOutput.final_output === 'string' 
                          ? finalOutput.final_output 
                          : JSON.stringify(finalOutput.final_output, null, 2)
                        }
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>

                {/* Variables and Input Area */}
                <div className="border-t border-gray-200 p-4">
                  {/* Variables */}
                  {Object.keys(variables).length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Variables ({Object.keys(variables).length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(variables).map(([key, value]) => {
                          const isFromExecution = key in executionVariables;
                          const isFromDefinition = key in workflowDefinedVariables;
                          
                          return (
                            <button
                              key={key}
                              onClick={() => handleVariableEdit(key, value)}
                              className={`px-3 py-1 rounded-lg text-sm hover:opacity-80 transition-colors border relative ${
                                isFromExecution 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : isFromDefinition 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                              title={
                                isFromExecution 
                                  ? 'Runtime variable (from execution)' 
                                  : isFromDefinition 
                                  ? 'Defined variable (from workflow definition)'
                                  : 'Variable'
                              }
                            >
                              {/* Status indicator */}
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                isFromExecution 
                                  ? 'bg-green-500' 
                                  : isFromDefinition 
                                  ? 'bg-blue-500'
                                  : 'bg-gray-500'
                              }`} />
                              {key}: {value === null ? 'null' : String(value).length > 20 ? String(value).substring(0, 20) + '...' : String(value)}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Legend */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                          <span>Runtime (执行时)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                          <span>Defined (定义时)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="flex space-x-3">
                    <textarea
                      ref={textareaRef}
                      value={currentMessage}
                      onChange={handleTextareaChange}
                      placeholder={canSubmitInput ? "Type your message to continue workflow..." : "Chat with AI about this execution..."}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      rows={1}
                      style={{ minHeight: '40px', maxHeight: '120px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (canSubmitInput) {
                            handleContinueExecution();
                          } else {
                            handleSendMessage();
                          }
                        }
                      }}
                    />
                    
                    {canSubmitInput ? (
                      <button
                        onClick={handleContinueExecution}
                        disabled={continueLoading || !currentMessage.trim()}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors flex items-center space-x-2"
                      >
                        {continueLoading ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <span>▶️</span>
                            <span>Continue</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleSendMessage}
                        disabled={chatLoading || !currentMessage.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors flex items-center space-x-2"
                      >
                        {chatLoading ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>💬</span>
                            <span>Send</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-6">👆</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Select Execution Record</h3>
                  <p>Click on an execution record on the left to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variable Edit Modal */}
      {editingVariable && (
        <VariableEditModal
          variableKey={editingVariable.key}
          variableValue={editingVariable.value}
          onSave={handleVariableSave}
          onClose={() => setEditingVariable(null)}
        />
      )}
    </div>
  );
};

export default ExecutionView; 