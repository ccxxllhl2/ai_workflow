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
      setError('Failed to load workflows');
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      alert('Please enter workflow name');
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
      alert('Failed to create workflow');
      console.error('Failed to create workflow:', err);
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    try {
      await workflowApi.deleteWorkflow(id);
      setWorkflows(workflows.filter(w => w.id !== id));
    } catch (err) {
      alert('Failed to delete workflow');
      console.error('Failed to delete workflow:', err);
    }
  };

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case WorkflowStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case WorkflowStatus.ARCHIVED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workflow Manager</h1>
        <div className="space-x-2">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Workflow
          </button>
          <button
            onClick={onCreateNewWorkflow}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Enter Editor
          </button>
          <button
            onClick={loadWorkflows}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {workflows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No workflows yet. Click "Create Workflow" to get started
          </div>
        ) : (
          workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{workflow.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </span>
                  </div>
                  {workflow.description && (
                    <p className="text-gray-600 mb-2">{workflow.description}</p>
                  )}
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>Created: {formatDate(workflow.created_at)}</div>
                    <div>Updated: {formatDate(workflow.updated_at)}</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSelectWorkflow(workflow)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Workflow Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Create New Workflow</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter workflow description (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowManager; 