import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { metaApi } from '../../services/api';

interface JiraNodeData {
  title: string;
  jiraSource: string;
  jiraKeys: string;
  outputVariable?: string;
}

interface JiraNodeProps {
  data: JiraNodeData;
  selected?: boolean;
}

const JiraNode: React.FC<JiraNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 min-w-[200px] ${
      selected ? 'border-blue-500' : 'border-gray-300'
    }`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        <div className="font-medium text-gray-900">
          {data.title || 'Jira Node'}
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        <div>Source: {data.jiraSource || 'Not configured'}</div>
        <div>Keys: {data.jiraKeys ? data.jiraKeys.substring(0, 20) + (data.jiraKeys.length > 20 ? '...' : '') : 'Not configured'}</div>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

interface JiraConfigPanelProps {
  data: JiraNodeData;
  onChange: (data: JiraNodeData) => void;
}

export const JiraConfigPanel: React.FC<JiraConfigPanelProps> = ({ data, onChange }) => {
  const [hasJiraToken, setHasJiraToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<JiraNodeData>({
    title: data.title || 'Jira Node',
    jiraSource: data.jiraSource || 'wpb',
    jiraKeys: data.jiraKeys || '',
    outputVariable: data.outputVariable || 'jira_output'
  });

  // 检查是否配置了Jira Token
  useEffect(() => {
    checkJiraToken();
  }, []);

  const checkJiraToken = async () => {
    try {
      setLoading(true);
      const metaData = await metaApi.getAllMeta();
      setHasJiraToken(!!metaData.jira_token);
    } catch (error) {
      console.error('Failed to check Jira token:', error);
      setHasJiraToken(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof JiraNodeData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          节点名称
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Jira Node"
        />
      </div>

      {/* Jira Token检查 */}
      {loading ? (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : !hasJiraToken ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm">
              请先在全局设置中配置Jira API Key
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-700 text-sm">
              Jira API Key已配置
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jira Source
        </label>
        <select
          value={formData.jiraSource}
          onChange={(e) => handleChange('jiraSource', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="wpb">wpb</option>
          <option value="alm">alm</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Epic Key列表
        </label>
        <textarea
          value={formData.jiraKeys}
          onChange={(e) => handleChange('jiraKeys', e.target.value)}
          placeholder="输入Epic Key，用逗号分隔，例如：WP-918, WSE-111"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          请输入多个Epic Key，用逗号分隔
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          输出变量名
        </label>
        <input
          type="text"
          value={formData.outputVariable}
          onChange={(e) => handleChange('outputVariable', e.target.value)}
          placeholder="jira_output"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Jira数据将保存到此变量中，供后续节点使用
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">节点说明</h4>
        <p className="text-xs text-gray-600">
          此节点将调用Jira API获取指定Epic的信息，并返回Markdown格式的内容。
        </p>
      </div>
    </div>
  );
};

export default JiraNode; 