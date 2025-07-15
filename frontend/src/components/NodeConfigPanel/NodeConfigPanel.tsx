import React, { useState, useEffect } from 'react';
import { WorkflowNode, NodeType, Agent } from '../../types/workflow';
import { agentApi } from '../../services/api';
import { Variable } from '../../utils/variableExtractor';
import { JiraConfigPanel } from '../NodeTypes/JiraNode';

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
  variables: Variable[];
}

// New component for IfNode configuration
const IfNodeConfig: React.FC<{
  config: any;
  onConfigChange: (newConfig: any) => void;
  variables: Variable[];
}> = ({ config, onConfigChange, variables }) => {
  const [conditions, setConditions] = useState(config.conditions || []);
  const [logic, setLogic] = useState(config.logic || 'AND');

  useEffect(() => {
    onConfigChange({ ...config, conditions, logic });
  }, [conditions, logic]);

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: Date.now().toString(),
        variable: '',
        operator: '==',
        value: '',
      },
    ]);
  };

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((condition: any, i: number) => i !== index));
  };
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        This node directs the workflow based on one or more conditions. If the conditions are met, the workflow follows the 'True' path; otherwise, it follows the 'False' path.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Condition Logic
        </label>
        <select
          value={logic}
          onChange={(e) => setLogic(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="AND">All conditions must be true (AND)</option>
          <option value="OR">At least one condition must be true (OR)</option>
        </select>
      </div>

      {conditions.map((condition: any, index: number) => (
        <div key={condition.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800">Condition #{index + 1}</span>
            <button
              onClick={() => removeCondition(index)}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <select
            value={condition.variable}
            onChange={(e) => updateCondition(index, 'variable', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a variable</option>
            {variables.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} (from {v.nodeLabel})
              </option>
            ))}
          </select>
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="==">Equals</option>
            <option value="!=">Not Equals</option>
            <option value=">">Greater Than</option>
            <option value="<">Less Than</option>
            <option value=">=">Greater Than or Equal To</option>
            <option value="<=">Less Than or Equal To</option>
            <option value="contains">Contains</option>
            <option value="not_contains">Does Not Contain</option>
            <option value="starts_with">Starts With</option>
            <option value="ends_with">Ends With</option>
          </select>
          <input
            type="text"
            value={condition.value}
            onChange={(e) => updateCondition(index, 'value', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Value to compare"
          />
        </div>
      ))}
      <button
        onClick={addCondition}
        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
      >
        + Add Condition
      </button>
    </div>
  );
};

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  variables
}) => {
  const [config, setConfig] = useState<any>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [clickedVariable, setClickedVariable] = useState<string | null>(null);
  const [startVariables, setStartVariables] = useState<Array<{id: string, name: string, defaultValue: string, description: string}>>([]);

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {});
      if (node.type === NodeType.AGENT) {
        loadAgents();
      }
      if (node.type === NodeType.START) {
        // Initialize start variables from config
        const existingVariables = node.data.config?.startVariables || [];
        if (existingVariables.length === 0) {
          // Add default variable if none exists
          setStartVariables([{
            id: Date.now().toString(),
            name: '',
            defaultValue: '',
            description: ''
          }]);
        } else {
          setStartVariables(existingVariables);
        }
      }
    }
  }, [node]);

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
      let finalConfig = { ...config };
      
      // For START nodes, include startVariables in config
      if (node.type === NodeType.START) {
        finalConfig.startVariables = startVariables;
        // Also generate initialVariables JSON for backwards compatibility
        const initialVars: any = {};
        startVariables.forEach(variable => {
          if (variable.name.trim()) {
            initialVars[variable.name] = variable.defaultValue || '';
          }
        });
        finalConfig.initialVariables = JSON.stringify(initialVars, null, 2);
      }
      
      onSave(node.id, finalConfig);
      onClose();
    }
  };

  const handleVariableClick = (variableName: string) => {
    const jinjaText = `{{${variableName}}}`;
    
    // Try to find the currently focused input/textarea element
    let targetElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
    
    // If no element is focused or focused element is not an input/textarea, find a suitable one
    if (!targetElement || (targetElement.tagName !== 'INPUT' && targetElement.tagName !== 'TEXTAREA')) {
      // Find all input and textarea elements in the dialog
      const dialogElement = document.querySelector('.fixed.inset-0');
      if (dialogElement) {
        const inputElements = dialogElement.querySelectorAll('input[type="text"], textarea') as NodeListOf<HTMLInputElement | HTMLTextAreaElement>;
        
        // Prioritize based on node type and common patterns
        const prioritizedSelectors = [
          'textarea[placeholder*="prompt"]', // Agent node prompt
          'textarea[placeholder*="template"]', // Various template fields
          'input[placeholder*="condition"]', // IF node condition
          'input[placeholder*="message"]', // Human control message
          'input[placeholder*="variable"]', // Variable name fields
          'textarea', // Any textarea
          'input[type="text"]' // Any text input
        ];
        
        // Try to find the most relevant input field
        for (const selector of prioritizedSelectors) {
          const element = dialogElement.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
          if (element && !element.readOnly && !element.disabled) {
            targetElement = element;
            break;
          }
        }
        
        // If still no suitable element found, use the first available input/textarea
        if (!targetElement && inputElements.length > 0) {
          for (let i = 0; i < inputElements.length; i++) {
            const element = inputElements[i];
            if (!element.readOnly && !element.disabled) {
              targetElement = element;
              break;
            }
          }
        }
      }
    }
    
    if (targetElement && (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA')) {
      // Focus the target element first
      targetElement.focus();
      
      // Wait a bit for focus to complete, then insert text
      setTimeout(() => {
        const start = targetElement.selectionStart || 0;
        const end = targetElement.selectionEnd || 0;
        const value = targetElement.value;
        const newValue = value.substring(0, start) + jinjaText + value.substring(end);
        
        // For React controlled components, we need to trigger the change event
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 
          "value"
        )?.set;
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 
          "value"
        )?.set;
        
        if (targetElement.tagName === 'INPUT' && nativeInputValueSetter) {
          nativeInputValueSetter.call(targetElement, newValue);
        } else if (targetElement.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
          nativeTextAreaValueSetter.call(targetElement, newValue);
        }
        
        // Trigger React's onChange event
        const event = new Event('input', { bubbles: true });
        targetElement.dispatchEvent(event);
        
        // Set cursor position after inserted text
        const newCursorPos = start + jinjaText.length;
        setTimeout(() => {
          targetElement.setSelectionRange(newCursorPos, newCursorPos);
          targetElement.focus();
        }, 0);
        
        // Show visual feedback
        setClickedVariable(variableName);
        setTimeout(() => {
          setClickedVariable(null);
        }, 1000);
      }, 50);
    } else {
      // Fallback: copy to clipboard and show message
      navigator.clipboard?.writeText(jinjaText);
      setClickedVariable(variableName);
      setTimeout(() => {
        setClickedVariable(null);
      }, 1000);
    }
  };

  const renderVariableSelector = () => {
    if (variables.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <div className="text-sm">No variables available</div>
          <div className="text-xs mt-1">Variables will appear as you configure nodes</div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700 mb-2">Click to insert variable:</div>
        <div className="flex flex-wrap gap-2">
          {variables.map((variable, index) => (
            <button
              key={`${variable.nodeId}-${variable.name}-${index}`}
              onClick={() => handleVariableClick(variable.name)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                clickedVariable === variable.name
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 hover:border-blue-300'
              }`}
              title={`Click to insert {{${variable.name}}}`}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {variable.name}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStartNodeConfig = () => {
    const addVariable = () => {
      setStartVariables([...startVariables, {
        id: Date.now().toString(),
        name: '',
        defaultValue: '',
        description: ''
      }]);
    };

    const removeVariable = (id: string) => {
      if (startVariables.length > 1) {
        setStartVariables(startVariables.filter(v => v.id !== id));
      }
    };

    const updateVariable = (id: string, field: string, value: string) => {
      setStartVariables(startVariables.map(v => 
        v.id === id ? { ...v, [field]: value } : v
      ));
    };

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Initial Variables
            </label>
            <button
              type="button"
              onClick={addVariable}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Variable
            </button>
          </div>

          <div className="space-y-3">
            {startVariables.map((variable, index) => (
              <div key={variable.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Variable {index + 1}</span>
                  {startVariables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariable(variable.id)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Variable Name *
                    </label>
                    <input
                      type="text"
                      value={variable.name}
                      onChange={(e) => updateVariable(variable.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="variable_name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Default Value
                    </label>
                    <input
                      type="text"
                      value={variable.defaultValue}
                      onChange={(e) => updateVariable(variable.id, 'defaultValue', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="default value"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={variable.description}
                      onChange={(e) => updateVariable(variable.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="description (optional)"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 mt-2">
            <p>• Variable names should follow standard naming conventions (letters, numbers, underscore)</p>
            <p>• Default values will be used when the workflow starts</p>
            <p>• Descriptions help other users understand the purpose of each variable</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAgentNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Model Type
        </label>
        <select
          value={config.modelType !== undefined ? config.modelType : 'qwen'}
          onChange={(e) => {
            const newType = e.target.value;
            const defaultModelName = newType === 'qwen' ? 'qwen-turbo' : 
                                   newType === 'openai' ? 'gpt-3.5-turbo' : '';
            setConfig({ ...config, modelType: newType, modelName: defaultModelName });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="qwen">Qwen Large Model</option>
          <option value="openai">OpenAI ChatGPT</option>
          <option value="agent">Use Configured Agent</option>
        </select>
      </div>

      {config.modelType === 'agent' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Agent
          </label>
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : (
            <select
              value={config.agentId !== undefined ? config.agentId : ''}
              onChange={(e) => setConfig({ ...config, agentId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Please select Agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.model})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {config.modelType === 'qwen' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qwen Model
          </label>
          <input
            type="text"
            value={config.modelName !== undefined ? config.modelName : 'qwen-turbo'}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            placeholder="qwen-turbo"
          />
          <div className="text-xs text-gray-500 mt-1">
            Using Qwen large model, requires QwenToken environment variable configuration
          </div>
        </div>
      )}

      {config.modelType === 'openai' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            OpenAI Model
          </label>
          <select
            value={config.modelName !== undefined ? config.modelName : 'gpt-3.5-turbo'}
            onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Using OpenAI ChatGPT models, requires OPENAI_API_KEY environment variable configuration
          </div>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prompt Template
        </label>
        <textarea
          value={config.prompt !== undefined ? config.prompt : ''}
          onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
          placeholder="Enter prompt template, supports Jinja2 syntax, e.g: Hello {{name}}!"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Output Variable Name
        </label>
        <input
          type="text"
          value={config.outputVariable !== undefined ? config.outputVariable : 'agent_output'}
          onChange={(e) => setConfig({ ...config, outputVariable: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="agent_output"
        />
      </div>
    </div>
  );

  const renderIfNodeConfig = () => {
    return <IfNodeConfig config={config} onConfigChange={setConfig} variables={variables} />;
  };

  const renderHumanControlNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Human Intervention Description
        </label>
        <textarea
          value={config.message !== undefined ? config.message : ''}
          onChange={(e) => setConfig({ ...config, message: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Please describe the required human intervention..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Timeout (seconds)
        </label>
        <input
          type="number"
          value={config.timeout !== undefined ? config.timeout : 300}
          onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Allowed Actions
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.allowContinue !== false}
              onChange={(e) => setConfig({ ...config, allowContinue: e.target.checked })}
              className="mr-2"
            />
            Allow Continue
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.allowStop !== undefined ? config.allowStop : false}
              onChange={(e) => setConfig({ ...config, allowStop: e.target.checked })}
              className="mr-2"
            />
            Allow Stop
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.allowModifyVariables !== undefined ? config.allowModifyVariables : false}
              onChange={(e) => setConfig({ ...config, allowModifyVariables: e.target.checked })}
              className="mr-2"
            />
            Allow Modify Variables
          </label>
        </div>
      </div>
    </div>
  );

  const renderEndNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Output Text Template
        </label>
        <textarea
          value={config.output_text !== undefined ? config.output_text : ''}
          onChange={(e) => setConfig({ ...config, output_text: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Input value is: {{input}}"
        />
        <div className="text-xs text-gray-500 mt-1">
          Supports Jinja2 syntax, can reference workflow variables, e.g: {'{{input}}'} or {'{{agent_output}}'}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Result Output Format
        </label>
        <select
          value={config.outputFormat !== undefined ? config.outputFormat : 'custom'}
          onChange={(e) => setConfig({ ...config, outputFormat: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="json">JSON Format</option>
          <option value="text">Text Format</option>
          <option value="custom">Custom Format</option>
        </select>
      </div>

      {config.outputFormat === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Output Template (Fallback)
          </label>
          <textarea
            value={config.customTemplate !== undefined ? config.customTemplate : ''}
            onChange={(e) => setConfig({ ...config, customTemplate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Execution result: {{result}}"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Success Status Code
        </label>
        <input
          type="number"
          value={config.successCode !== undefined ? config.successCode : 200}
          onChange={(e) => setConfig({ ...config, successCode: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
      case NodeType.IF:
        return renderIfNodeConfig();
      case NodeType.HUMAN_CONTROL:
        return renderHumanControlNodeConfig();
      case NodeType.JIRA:
        return <JiraConfigPanel data={config} onChange={setConfig} />;
      case NodeType.END:
        return renderEndNodeConfig();
      default:
        return <div>Unsupported node type</div>;
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
      case NodeType.IF:
        return 'Condition Node';
      case NodeType.HUMAN_CONTROL:
        return 'Human Control Node';
      case NodeType.JIRA:
        return 'Jira Node';
      case NodeType.END:
        return 'End Node';
      default:
        return 'Unknown Node';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 animate-in fade-in zoom-in-95">
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
            value={config.label !== undefined ? config.label : node.data.label}
            onChange={(e) => setConfig({ ...config, label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {renderNodeConfig()}

        {/* Variable Selector */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900">Available Variables</h3>
          </div>
          {renderVariableSelector()}
        </div>

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