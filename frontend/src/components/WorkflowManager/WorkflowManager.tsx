import React, { useState, useEffect } from 'react';
import { Workflow, WorkflowStatus } from '../../types/workflow';
import { workflowApi } from '../../services/api';

interface WorkflowManagerProps {
  onSelectWorkflow: (workflow: Workflow) => void;
  onCreateNewWorkflow: () => void;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ 
  onSelectWorkflow, 
  onCreateNewWorkflow 
}) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowApi.getWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err) {
      setError('加载工作流失败');
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      alert('请输入工作流名称');
      return;
    }

    try {
      const defaultConfig = {
        nodes: [
          {
            id: '1',
            type: 'start',
            position: { x: 250, y: 25 },
            data: { label: 'Start', config: {} }
          }
        ],
        edges: []
      };

      const newWorkflow = await workflowApi.createWorkflow({
        name: newWorkflowName.trim(),
        description: newWorkflowDescription.trim(),
        config: JSON.stringify(defaultConfig)
      });

      setWorkflows([...workflows, newWorkflow]);
      setShowCreateDialog(false);
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      onSelectWorkflow(newWorkflow);
    } catch (err) {
      alert('创建工作流失败');
      console.error('Failed to create workflow:', err);
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    if (!window.confirm('确定要删除这个工作流吗？')) {
      return;
    }

    try {
      await workflowApi.deleteWorkflow(id);
      setWorkflows(workflows.filter(w => w.id !== id));
    } catch (err) {
      alert('删除工作流失败');
      console.error('Failed to delete workflow:', err);
    }
  };

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.ACTIVE:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case WorkflowStatus.DRAFT:
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case WorkflowStatus.ARCHIVED:
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.ACTIVE:
        return '活跃';
      case WorkflowStatus.DRAFT:
        return '草稿';
      case WorkflowStatus.ARCHIVED:
        return '归档';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          <span className="text-gray-600">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">工作流管理</h1>
            <p className="text-gray-600">创建和管理您的AI工作流程</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadWorkflows}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              新建工作流
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span className="ml-3 text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有工作流</h3>
          <p className="text-gray-600 mb-6">创建您的第一个AI工作流来开始使用</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            创建工作流
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group"
              onClick={() => onSelectWorkflow(workflow)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 mb-2 line-clamp-2">
                    {workflow.name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                    {getStatusText(workflow.status)}
                  </span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectWorkflow(workflow);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWorkflow(workflow.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {workflow.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {workflow.description}
                </p>
              )}
              
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>创建时间</span>
                  <span>{formatDate(workflow.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>更新时间</span>
                  <span>{formatDate(workflow.updated_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workflow Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">创建新工作流</h2>
              <p className="text-sm text-gray-600 mt-1">设置您的新AI工作流</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  工作流名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="输入工作流名称"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  描述 <span className="text-gray-400">(可选)</span>
                </label>
                <textarea
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="描述这个工作流的用途..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewWorkflowName('');
                  setNewWorkflowDescription('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateWorkflow}
                disabled={!newWorkflowName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                创建工作流
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowManager; 