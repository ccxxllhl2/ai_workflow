import React, { useState, useEffect, useRef } from 'react';
import { WorkflowNode, NodeType, Agent, ExternalAgent } from '../../types/workflow';
import { agentApi, externalAgentApi } from '../../services/api';
import { extractVariablesFromNodes, Variable } from '../../utils/variableExtractor';

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
  allNodes?: WorkflowNode[];  // 所有节点，用于提取变量
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  allNodes = []
}) => {
  const [config, setConfig] = useState<any>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [externalAgents, setExternalAgents] = useState<ExternalAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<ExternalAgent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node) {
      let nodeConfig = node.data.config || {};
      
      // 根据节点类型清理配置
      switch (node.type) {
        case NodeType.START:
          // Start节点确保有 initialVariables 和 variableDescriptions 字段
          if (!nodeConfig.initialVariables) {
            nodeConfig.initialVariables = '{}';
          }
          if (!nodeConfig.variableDescriptions) {
            nodeConfig.variableDescriptions = '{}';
          }
          break;
        case NodeType.AGENT:
          // Agent节点移除可能错误存在的 initialVariables 字段
          if (nodeConfig.initialVariables) {
            const { initialVariables, ...cleanConfig } = nodeConfig;
            nodeConfig = cleanConfig;
          }
        loadExternalAgents();
          break;
        case NodeType.IF:
        case NodeType.END:
          // IF和End节点移除可能错误存在的 initialVariables 字段
          if (nodeConfig.initialVariables) {
            const { initialVariables, ...cleanConfig } = nodeConfig;
            nodeConfig = cleanConfig;
          }
          break;
      }
      
      setConfig(nodeConfig);
    }
  }, [node]);

  // 获取外部Agent列表
  const loadExternalAgents = async () => {
    try {
      setLoading(true);
      const response = await externalAgentApi.getExternalAgents();
      setExternalAgents(response.agents || []);
    } catch (error) {
      console.error('Failed to get external agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // 监听agentId变化，设置选中的Agent
  useEffect(() => {
    if (config.agentId && externalAgents.length > 0) {
      const agent = externalAgents.find(a => a.id === config.agentId);
      setSelectedAgent(agent || null);
    }
  }, [config.agentId, externalAgents]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await agentApi.getAgents();
      setAgents(data);
    } catch (err) {
      console.error('Failed to load Agent list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (node) {
      // 根据节点类型清理配置，移除不应该存在的字段
      let cleanedConfig = { ...config };
      
      switch (node.type) {
        case NodeType.START:
          // Start节点只保留 initialVariables、variableDescriptions 和 label，移除临时字段
          cleanedConfig = {
            label: cleanedConfig.label,
            initialVariables: cleanedConfig.initialVariables || '{}',
            variableDescriptions: cleanedConfig.variableDescriptions || '{}'
          };
          break;
        case NodeType.AGENT:
          // Agent节点移除 initialVariables 字段
          delete cleanedConfig.initialVariables;
          break;
        case NodeType.IF:
          // IF节点移除 initialVariables 字段
          delete cleanedConfig.initialVariables;
          break;
        case NodeType.END:
          // End节点移除 initialVariables 字段
          delete cleanedConfig.initialVariables;
          break;
      }
      
      onSave(node.id, cleanedConfig);
      onClose();
    }
  };

  const promptTextAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // 生成变量的颜色，基于变量名的哈希值
  const getVariableColor = (varName: string) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200', 
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200'
    ];
    
    let hash = 0;
    for (let i = 0; i < varName.length; i++) {
      hash = ((hash << 5) - hash + varName.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // 在textarea光标位置插入文本
  const insertTextAtCursor = (text: string) => {
    const textarea = promptTextAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = config.prompt || '';
    
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    
    setConfig({ ...config, prompt: newValue });
    
    // 重新聚焦并设置光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const renderStartNodeConfig = () => {
    // 确保只在Start节点中处理初始变量
    if (!node || node.type !== NodeType.START) {
      console.error('renderStartNodeConfig 被错误地调用于非Start节点:', node?.type);
      return <div>Configuration Error: This is not a Start node</div>;
    }

    // 解析当前的初始变量
    let initialVariables: Record<string, string> = {};
    let variableDescriptions: Record<string, string> = {};
    
    try {
      if (config.initialVariables && typeof config.initialVariables === 'string') {
        // 确保只有当 initialVariables 是字符串时才尝试解析
        const parsed = JSON.parse(config.initialVariables);
        if (typeof parsed === 'object' && parsed !== null) {
          initialVariables = parsed;
        }
      } else if (typeof config.initialVariables === 'object' && config.initialVariables !== null) {
        // 如果已经是对象，直接使用
        initialVariables = config.initialVariables;
      }
    } catch (error) {
      console.warn('无法解析初始变量JSON:', error, 'config.initialVariables:', config.initialVariables);
      // 如果解析失败，重置为空对象
      initialVariables = {};
    }

    // 解析变量描述
    try {
      if (config.variableDescriptions && typeof config.variableDescriptions === 'string') {
        const parsed = JSON.parse(config.variableDescriptions);
        if (typeof parsed === 'object' && parsed !== null) {
          variableDescriptions = parsed;
        }
      } else if (typeof config.variableDescriptions === 'object' && config.variableDescriptions !== null) {
        variableDescriptions = config.variableDescriptions;
      }
    } catch (error) {
      console.warn('无法解析变量描述JSON:', error);
      variableDescriptions = {};
    }

    // 将变量转换为数组格式用于UI显示，合并值和描述
    const variableEntries: [string, string, string][] = config._tempVariableEntries || 
      Object.entries(initialVariables).map(([key, value]) => [
        key, 
        value, 
        variableDescriptions[key] || ''
      ]);

    const updateVariable = (index: number, key: string, value: string, description?: string) => {
      const newEntries: [string, string, string][] = [...variableEntries];
      const currentEntry = newEntries[index] || ['', '', ''];
      
      if (description !== undefined) {
        newEntries[index] = [key, currentEntry[1], description];
      } else {
        newEntries[index] = [key, value, currentEntry[2]];
      }
      
      // 构建最终的JSON字符串，只包含非空键的变量
      const variables: Record<string, string> = {};
      const descriptions: Record<string, string> = {};
      newEntries.forEach(([k, v, desc]: [string, string, string]) => {
        if (k && k.trim()) { // 只添加非空key
          variables[k] = v;
          descriptions[k] = desc || '';
        }
      });
      
      setConfig({ 
        ...config, 
        _tempVariableEntries: newEntries,
        initialVariables: JSON.stringify(variables, null, 2),
        variableDescriptions: JSON.stringify(descriptions, null, 2)
      });
    };

    const addVariable = () => {
      const newEntries: [string, string, string][] = [...variableEntries, ['', '', '']];
      
      // 构建最终的JSON字符串，只包含非空键的变量
      const variables: Record<string, string> = {};
      const descriptions: Record<string, string> = {};
      newEntries.forEach(([k, v, desc]: [string, string, string]) => {
        if (k && k.trim()) { // 只添加非空key
          variables[k] = v;
          descriptions[k] = desc || '';
        }
      });
      
      setConfig({ 
        ...config, 
        _tempVariableEntries: newEntries,
        initialVariables: JSON.stringify(variables, null, 2),
        variableDescriptions: JSON.stringify(descriptions, null, 2)
      });
    };

    const removeVariable = (index: number) => {
      const newEntries: [string, string, string][] = variableEntries.filter((_: any, i: number) => i !== index);
      
      // 构建最终的JSON字符串，只包含非空键的变量
      const variables: Record<string, string> = {};
      const descriptions: Record<string, string> = {};
      newEntries.forEach(([k, v, desc]: [string, string, string]) => {
        if (k && k.trim()) { // 只添加非空key
          variables[k] = v;
          descriptions[k] = desc || '';
        }
      });
      
      setConfig({ 
        ...config, 
        _tempVariableEntries: newEntries,
        initialVariables: JSON.stringify(variables, null, 2),
        variableDescriptions: JSON.stringify(descriptions, null, 2)
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Workflow Parameter Definition
          </label>
          <div className="space-y-3">
            {variableEntries.map(([key, value, description]: [string, string, string], index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => updateVariable(index, e.target.value, value)}
                    placeholder="Parameter Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateVariable(index, key, e.target.value)}
                    placeholder="Default Value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariable(index)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Parameter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                </div>
                <div className="ml-0">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => updateVariable(index, key, value, e.target.value)}
                    placeholder="Parameter Description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addVariable}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Parameter</span>
            </button>
          </div>
          
          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Parameter Instructions:</p>
                <ul className="text-xs space-y-1">
                  <li>• These parameters will serve as input parameters for the workflow</li>
                  <li>• You need to provide values for these parameters when calling the API</li>
                  <li>• Default values are only used for editor preview, actual runtime values will be overridden by API input</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAgentNodeConfig = () => {
    // 获取所有可用变量
    const availableVariables = extractVariablesFromNodes(allNodes);
    
    return (
    <div className="space-y-4">
      <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
          Select Agent
        </label>
            <button
              onClick={loadExternalAgents}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center gap-1"
              title="Refresh Agent List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading Agent list...</div>
          ) : externalAgents.length === 0 ? (
            <div className="space-y-2">
              <select
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-400"
              >
                <option>No available Agents</option>
              </select>
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Unable to get Agent list</p>
                    <p className="text-xs mt-1">Please ensure the external Agent service is running, then click the refresh button to retry.</p>
                  </div>
                </div>
              </div>
            </div>
        ) : (
          <select
            value={config.agentId || ''}
            onChange={(e) => setConfig({ ...config, agentId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Please Select Agent</option>
            {externalAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedAgent && (
        <div className="bg-gray-50 p-3 rounded-md">
          <h4 className="font-medium text-gray-800 mb-2">Agent Information</h4>
          <p className="text-sm text-gray-600">
            <strong>Description:</strong> {selectedAgent.description}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Model:</strong> {selectedAgent.modelName}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prompt Template
        </label>
        <textarea
          ref={promptTextAreaRef}
          value={config.prompt || ''}
          onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
          placeholder="You can use {{variable_name}} to reference variables, or directly input prompts..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-vertical"
        />
        
        {availableVariables.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-600 mb-2">Click variable tags to insert into prompt:</div>
            <div className="flex flex-wrap gap-1">
              {availableVariables.map((variable) => (
                <button
                  key={`${variable.nodeId}-${variable.name}`}
                  onClick={() => insertTextAtCursor(`{{${variable.name}}}`)}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border transition-colors hover:shadow-sm ${getVariableColor(variable.name)}`}
                  title={`From ${variable.nodeLabel} (${variable.nodeType})`}
                >
                  {variable.name}
                </button>
              ))}
            </div>
        </div>
        )}
      </div>
    </div>
  );
  };

  const renderIfNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Condition Expression
        </label>
        <input
          type="text"
          value={config.condition || ''}
          onChange={(e) => setConfig({ ...config, condition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="{{variable}} == 'value'"
        />
        <div className="text-xs text-gray-500 mt-1">
          Supports Jinja2 syntax, e.g: {'{{variable}} == "value"'} or {'{{number}} > 10'}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          True Branch Label
        </label>
        <input
          type="text"
          value={config.trueLabel || 'Yes'}
          onChange={(e) => setConfig({ ...config, trueLabel: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Yes"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          False Branch Label
        </label>
        <input
          type="text"
          value={config.falseLabel || 'No'}
          onChange={(e) => setConfig({ ...config, falseLabel: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="No"
        />
      </div>
    </div>
  );

  const renderEndNodeConfig = () => (
    <div className="bg-green-50 p-4 rounded-md border border-green-200">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-medium text-green-800 mb-2">End Node</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p>• No configuration required</p>
            <p>• Automatically outputs string-formatted results</p>
            <p>• Marks workflow execution as complete</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderJiraNodeConfig = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129V13.1a5.218 5.218 0 0 0 5.232-5.215V6.782a1.024 1.024 0 0 0-1.018-1.025zM23.013.592H11.455a5.215 5.215 0 0 0 5.215 5.214h2.129V7.863a5.218 5.218 0 0 0 5.232-5.215V1.617A1.024 1.024 0 0 0 23.013.592z"/>
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">Jira Integration (Coming Soon)</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Create, update, and query Jira issues</p>
              <p>• Automate project workflows</p>
              <p>• Integration with Jira API</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Key
        </label>
        <input
          type="text"
          value={config.project || ''}
          onChange={(e) => setConfig({ ...config, project: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., PROJ"
          disabled
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue Type
        </label>
        <select
          value={config.issueType || ''}
          onChange={(e) => setConfig({ ...config, issueType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled
        >
          <option value="">Select Issue Type</option>
          <option value="story">Story</option>
          <option value="task">Task</option>
          <option value="bug">Bug</option>
          <option value="epic">Epic</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assignee
        </label>
        <input
          type="text"
          value={config.assignee || ''}
          onChange={(e) => setConfig({ ...config, assignee: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., john.doe@company.com"
          disabled
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={config.status || ''}
          onChange={(e) => setConfig({ ...config, status: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled
        >
          <option value="">Select Status</option>
          <option value="to-do">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-medium">Preview Feature</p>
            <p className="text-xs mt-1">This node is for demonstration purposes. Jira integration will be available in a future release.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfluenceNodeConfig = () => (
    <div className="space-y-4">
      <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200 mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.87 19.492c.494 1.516 1.528 2.594 3.01 3.14.49.18.995.252 1.528.22 1.51-.09 2.84-.99 3.61-2.45l4.75-9.03c1.21-2.3 3.99-3.19 6.29-1.98 2.3 1.21 3.19 3.99 1.98 6.29l-1.65 3.14c-.15.29-.03.65.26.8.29.15.65.03.8-.26l1.65-3.14c1.8-3.42.37-7.71-3.05-9.51-3.42-1.8-7.71-.37-9.51 3.05L4.77 18.832c-.54 1.02-1.47 1.65-2.53 1.71-.36.02-.71-.03-1.07-.15-1.04-.38-1.78-1.14-2.15-2.2-.15-.42-.05-.87.32-1.02.37-.15.83-.03.98.35zm22.26-14.98c-.49-1.516-1.528-2.594-3.01-3.14-.49-.18-.995-.252-1.528-.22-1.51.09-2.84.99-3.61 2.45l-4.75 9.03c-1.21 2.3-3.99 3.19-6.29 1.98-2.3-1.21-3.19-3.99-1.98-6.29l1.65-3.14c.15-.29.03-.65-.26-.8-.29-.15-.65-.03-.8.26l-1.65 3.14c-1.8 3.42-.37 7.71 3.05 9.51 3.42 1.8 7.71.37 9.51-3.05L19.23 5.168c.54-1.02 1.47-1.65 2.53-1.71.36-.02.71.03 1.07.15 1.04.38 1.78 1.14 2.15 2.2.15.42.05.87-.32 1.02-.37.15-.83.03-.98-.35z"/>
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-indigo-800 mb-2">Confluence Integration (Coming Soon)</h4>
            <div className="text-sm text-indigo-700 space-y-1">
              <p>• Create and update Confluence pages</p>
              <p>• Search and retrieve knowledge base content</p>
              <p>• Integration with Confluence API</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Space Key
        </label>
        <input
          type="text"
          value={config.spaceKey || ''}
          onChange={(e) => setConfig({ ...config, spaceKey: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., TEAM"
          disabled
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Page Title
        </label>
        <input
          type="text"
          value={config.pageTitle || ''}
          onChange={(e) => setConfig({ ...config, pageTitle: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g., Project Documentation"
          disabled
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Page URL
        </label>
        <input
          type="url"
          value={config.pageUrl || ''}
          onChange={(e) => setConfig({ ...config, pageUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="https://company.atlassian.net/wiki/spaces/TEAM/pages/..."
          disabled
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content Template
        </label>
        <textarea
          value={config.content || ''}
          onChange={(e) => setConfig({ ...config, content: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={4}
          placeholder="Page content template..."
          disabled
        />
      </div>

      <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
        <div className="flex items-start space-x-2">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-medium">Preview Feature</p>
            <p className="text-xs mt-1">This node is for demonstration purposes. Confluence integration will be available in a future release.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNodeConfig = () => {
    if (!node) return null;

    switch (node.type) {
      case NodeType.START:
        return renderStartNodeConfig();
      case NodeType.AGENT:
        return renderAgentNodeConfig();
      case NodeType.JIRA:
        return renderJiraNodeConfig();
      case NodeType.CONFLUENCE:
        return renderConfluenceNodeConfig();
      case NodeType.IF:
        return renderIfNodeConfig();
      case NodeType.END:
        return renderEndNodeConfig();
      default:
        console.warn('不支持的节点类型:', node.type);
        return <div>Unsupported node type: {node.type}</div>;
    }
  };

  if (!isOpen || !node) {
    return null;
  }

  const getNodeTypeName = (type: NodeType) => {
    switch (type) {
      case NodeType.START:
        return 'Start Node';
      case NodeType.AGENT:
        return 'Agent Node';
      case NodeType.JIRA:
        return 'Jira Node';
      case NodeType.CONFLUENCE:
        return 'Confluence Node';
      case NodeType.IF:
        return 'Condition Node';
      case NodeType.END:
        return 'End Node';
      default:
        console.warn('获取未知节点类型名称:', type);
        return `Unknown Node (${type})`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Configure {getNodeTypeName(node.type)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Label
          </label>
          <input
            type="text"
            value={config.label || node.data.label}
            onChange={(e) => setConfig({ ...config, label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {renderNodeConfig()}

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel; 