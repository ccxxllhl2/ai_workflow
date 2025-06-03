import React, { useState, useEffect, useRef } from 'react';
import { Workflow, WorkflowStatus } from '../../types/workflow';
import { workflowApi, ratingApi, WorkflowWithRating } from '../../services/api';

interface WorkflowManagerProps {
  onSelectWorkflow: (workflow: Workflow) => void;
  onCreateNewWorkflow: () => void;
  currentUser?: { id: number; username: string } | null;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = ({ 
  onSelectWorkflow, 
  onCreateNewWorkflow,
  currentUser
}) => {
  const [workflows, setWorkflows] = useState<WorkflowWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWorkflows();
  }, [currentUser]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowApi.getWorkflows(0, 100, currentUser?.id);
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

      // Reload workflows to get the updated list with ratings
      await loadWorkflows();
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

  const handleExportWorkflow = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await workflowApi.downloadWorkflow(id);
    } catch (err) {
      alert('Failed to export workflow');
      console.error('Failed to export workflow:', err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        alert('Please select a JSON file');
        return;
      }
      setImportFile(file);
    }
  };

  const handleImportWorkflow = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    setImporting(true);
    try {
      const fileContent = await importFile.text();
      const workflowData = JSON.parse(fileContent);
      
      // Validate the imported data structure
      if (!workflowData.config || !workflowData.name) {
        throw new Error('Invalid workflow file format');
      }

      const result = await workflowApi.importWorkflow(
        workflowData,
        importName.trim() || undefined,
        importDescription.trim() || undefined
      );

      if (result.success) {
        alert(`Workflow imported successfully: ${result.message}`);
        await loadWorkflows();
        setShowImportDialog(false);
        setImportFile(null);
        setImportName('');
        setImportDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Select the imported workflow if available
        if (result.workflow) {
          onSelectWorkflow(result.workflow);
        }
      } else {
        alert(`Import failed: ${result.message}`);
      }
    } catch (err) {
      alert(`Failed to import workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Failed to import workflow:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleLikeWorkflow = async (workflowId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please login to rate workflows');
      return;
    }

    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      // Toggle like: if already liked, remove rating; otherwise set to liked
      const newRating = workflow.user_rating === true ? null : true;
      
      await ratingApi.createOrUpdateRating(currentUser.id, workflowId, newRating);
      
      // Update local state
      setWorkflows(prevWorkflows => 
        prevWorkflows.map(w => {
          if (w.id === workflowId) {
            const updatedWorkflow = { ...w };
            
            // Update user rating
            const oldRating = w.user_rating;
            updatedWorkflow.user_rating = newRating;
            
            // Update counts
            if (oldRating === true && newRating === null) {
              // Remove like
              updatedWorkflow.like_count = Math.max(0, w.like_count - 1);
            } else if (oldRating === false && newRating === true) {
              // Change from dislike to like
              updatedWorkflow.like_count = w.like_count + 1;
              updatedWorkflow.dislike_count = Math.max(0, w.dislike_count - 1);
            } else if (oldRating === null && newRating === true) {
              // Add like
              updatedWorkflow.like_count = w.like_count + 1;
            }
            
            return updatedWorkflow;
          }
          return w;
        })
      );
    } catch (err) {
      console.error('Failed to update rating:', err);
      alert('Failed to update rating');
    }
  };

  const handleDislikeWorkflow = async (workflowId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please login to rate workflows');
      return;
    }

    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      // Toggle dislike: if already disliked, remove rating; otherwise set to disliked
      const newRating = workflow.user_rating === false ? null : false;
      
      await ratingApi.createOrUpdateRating(currentUser.id, workflowId, newRating);
      
      // Update local state
      setWorkflows(prevWorkflows => 
        prevWorkflows.map(w => {
          if (w.id === workflowId) {
            const updatedWorkflow = { ...w };
            
            // Update user rating
            const oldRating = w.user_rating;
            updatedWorkflow.user_rating = newRating;
            
            // Update counts
            if (oldRating === false && newRating === null) {
              // Remove dislike
              updatedWorkflow.dislike_count = Math.max(0, w.dislike_count - 1);
            } else if (oldRating === true && newRating === false) {
              // Change from like to dislike
              updatedWorkflow.dislike_count = w.dislike_count + 1;
              updatedWorkflow.like_count = Math.max(0, w.like_count - 1);
            } else if (oldRating === null && newRating === false) {
              // Add dislike
              updatedWorkflow.dislike_count = w.dislike_count + 1;
            }
            
            return updatedWorkflow;
          }
          return w;
        })
      );
    } catch (err) {
      console.error('Failed to update rating:', err);
      alert('Failed to update rating');
    }
  };

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.ACTIVE:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case WorkflowStatus.DRAFT:
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case WorkflowStatus.ARCHIVED:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: WorkflowStatus) => {
    switch (status) {
      case WorkflowStatus.ACTIVE:
        return 'Active';
      case WorkflowStatus.DRAFT:
        return 'Draft';
      case WorkflowStatus.ARCHIVED:
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
          <span className="text-gray-600">Loading...</span>
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
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Workflow Management</h1>
            <p className="text-gray-600">Create and manage your AI workflows</p>
            {currentUser && (
              <p className="text-sm text-gray-500 mt-1">Logged in as: {currentUser.username}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadWorkflows}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Workflow
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
          <p className="text-gray-600 mb-6">Create your first AI workflow to get started</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              onClick={() => onSelectWorkflow(workflow)}
              className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                    {workflow.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                    {getStatusText(workflow.status)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleExportWorkflow(workflow.id, e)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Export workflow"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectWorkflow(workflow);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
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
                    title="Delete"
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
              
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span>{formatDate(workflow.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Updated</span>
                  <span>{formatDate(workflow.updated_at)}</span>
                </div>
              </div>
              
              {/* Like and dislike buttons with counts */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                    </svg>
                    {workflow.like_count}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20" style={{ transform: 'rotate(180deg)' }}>
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                    </svg>
                    {workflow.dislike_count}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleLikeWorkflow(workflow.id, e)}
                    disabled={!currentUser}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      workflow.user_rating === true
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    } ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={currentUser ? "Like this workflow" : "Login to rate workflows"}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDislikeWorkflow(workflow.id, e)}
                    disabled={!currentUser}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      workflow.user_rating === false
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    } ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={currentUser ? "Dislike this workflow" : "Login to rate workflows"}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ transform: 'rotate(180deg)' }}>
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                    </svg>
                  </button>
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
              <h2 className="text-xl font-semibold text-gray-900">Create New Workflow</h2>
              <p className="text-sm text-gray-600 mt-1">Set up your new AI workflow</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Workflow Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Enter workflow name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Describe what this workflow does..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewWorkflowName('');
                  setNewWorkflowDescription('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                disabled={!newWorkflowName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Workflow Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Import Workflow</h2>
              <p className="text-sm text-gray-600 mt-1">Import a workflow from JSON file</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Select JSON File <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                {importFile && (
                  <p className="text-sm text-gray-600 mt-1">Selected: {importFile.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Custom Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Override workflow name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Custom Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Override workflow description"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                  setImportName('');
                  setImportDescription('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportWorkflow}
                disabled={!importFile || importing}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Importing...
                  </div>
                ) : (
                  'Import Workflow'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowManager; 