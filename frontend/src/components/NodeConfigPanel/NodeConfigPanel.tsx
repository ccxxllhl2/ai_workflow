import React, { useState, useEffect } from 'react';
import { WorkflowNode, NodeType, Agent } from '../../types/workflow';
import { agentApi } from '../../services/api';

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  isOpen,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<any>({});
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {});
      if (node.type === NodeType.AGENT) {
        loadAgents();
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
      onSave(node.id, config);
      onClose();
    }
  };

  const renderStartNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Initial Variables (JSON format)
        </label>
        <textarea
          value={config.initialVariables || '{}'}
          onChange={(e) => setConfig({ ...config, initialVariables: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder='{"variable1": "value1", "variable2": "value2"}'
        />
      </div>
    </div>
  );

  const renderAgentNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Model Type
        </label>
        <select
          value={config.modelType || 'qwen'}
          onChange={(e) => setConfig({ ...config, modelType: e.target.value, modelName: e.target.value === 'qwen' ? 'qwen-turbo' : '' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="qwen">Qwen Large Model</option>
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
              value={config.agentId || ''}
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
            value={config.modelName || 'qwen-turbo'}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            placeholder="qwen-turbo"
          />
          <div className="text-xs text-gray-500 mt-1">
            Using Qwen large model, requires QwenToken environment variable configuration
          </div>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prompt Template
        </label>
        <textarea
          value={config.prompt || ''}
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
          value={config.outputVariable || 'agent_output'}
          onChange={(e) => setConfig({ ...config, outputVariable: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="agent_output"
        />
      </div>
    </div>
  );

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

  const renderHumanControlNodeConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Human Intervention Description
        </label>
        <textarea
          value={config.message || ''}
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
          value={config.timeout || 300}
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
              checked={config.allowStop || false}
              onChange={(e) => setConfig({ ...config, allowStop: e.target.checked })}
              className="mr-2"
            />
            Allow Stop
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.allowModifyVariables || false}
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
          value={config.output_text || ''}
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
          value={config.outputFormat || 'custom'}
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
            value={config.customTemplate || ''}
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
          value={config.successCode || 200}
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
      case NodeType.END:
        return 'End Node';
      default:
        return 'Unknown Node';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
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