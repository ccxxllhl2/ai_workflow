import React, { useState, useEffect } from 'react';
import { metaApi } from '../../services/api';

interface GlobalSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    openai_token: '',
    jira_token: '',
    confluence_token: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 加载现有配置
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await metaApi.getAllMeta();
      setSettings({
        openai_token: data.openai_token || '',
        jira_token: data.jira_token || '',
        confluence_token: data.confluence_token || ''
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: '加载设置失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // 保存所有非空的设置
      const promises = [];
      if (settings.openai_token.trim()) {
        promises.push(metaApi.createOrUpdateMeta('openai_token', settings.openai_token.trim()));
      }
      if (settings.jira_token.trim()) {
        promises.push(metaApi.createOrUpdateMeta('jira_token', settings.jira_token.trim()));
      }
      if (settings.confluence_token.trim()) {
        promises.push(metaApi.createOrUpdateMeta('confluence_token', settings.confluence_token.trim()));
      }

      await Promise.all(promises);
      setMessage({ type: 'success', text: '设置保存成功' });
      
      // 3秒后自动关闭成功消息
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: '保存设置失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">全局设置</h2>
        </div>
        
        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">加载中...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={settings.openai_token}
                  onChange={(e) => handleInputChange('openai_token', e.target.value)}
                  placeholder="输入OpenAI API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jira API Key
                </label>
                <input
                  type="password"
                  value={settings.jira_token}
                  onChange={(e) => handleInputChange('jira_token', e.target.value)}
                  placeholder="输入Jira API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confluence API Key
                </label>
                <input
                  type="password"
                  value={settings.confluence_token}
                  onChange={(e) => handleInputChange('confluence_token', e.target.value)}
                  placeholder="输入Confluence API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          
          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings; 