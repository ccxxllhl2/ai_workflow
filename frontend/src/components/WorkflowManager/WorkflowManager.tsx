import React, { useState, useEffect, useRef } from 'react';
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
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importName, setImportName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      // Since we're removing auth, we'll use a simplified version that returns regular Workflow[]
      const data = await workflowApi.getWorkflows(0, 100);
      // Convert WorkflowWithRating[] to Workflow[] by mapping and removing rating properties
      const simplifiedWorkflows = data.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        config: workflow.config,
        status: workflow.status,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at
      }));
      setWorkflows(simplifiedWorkflows);
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
      alert('Please enter a workflow name');
      return;
    }

    try {
      await workflowApi.createWorkflow({
        name: newWorkflowName.trim(),
        description: newWorkflowDescription.trim(),
        config: JSON.stringify({ nodes: [], edges: [] })
      });
      
      setShowCreateDialog(false);
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      await loadWorkflows();
    } catch (err) {
      console.error('Failed to create workflow:', err);
      alert('Failed to create workflow');
    }
  };

  const handleDeleteWorkflow = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    try {
      await workflowApi.deleteWorkflow(id);
      await loadWorkflows();
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      alert('Failed to delete workflow');
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      // Auto-fill name from filename (without extension)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setImportName(nameWithoutExt);
    }
  };

  const handleImportWorkflow = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    if (!importName.trim()) {
      alert('Please enter a name for the imported workflow');
      return;
    }

    try {
      setImporting(true);
      
      // Read file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(importFile);
      });

      // Parse JSON
      const workflowData = JSON.parse(fileContent);

      // Import workflow
      const result = await workflowApi.importWorkflow(
        workflowData,
        importName.trim(),
        importDescription.trim()
      );

      if (result.success) {
        setShowImportDialog(false);
        setImportFile(null);
        setImportName('');
        setImportDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await loadWorkflows();
        alert('Workflow imported successfully!');
      } else {
        alert(`Import failed: ${result.message}`);
      }
    } catch (err) {
      console.error('Failed to import workflow:', err);
      alert('Failed to import workflow. Please check the file format.');
    } finally {
      setImporting(false);
    }
  };

  const handleExportWorkflow = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await workflowApi.downloadWorkflow(id);
    } catch (err) {
      console.error('Failed to export workflow:', err);
      alert('Failed to export workflow');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Workflows</h2>
          <p className="text-gray-600">Please wait while we fetch your workflows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Workflows</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadWorkflows}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
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
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadWorkflows}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm border border-gray-300/60 rounded-xl hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <button
              onClick={() => setShowImportDialog(true)}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm border border-gray-300/60 rounded-xl hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Import
            </button>

            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Grid */}
      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first workflow</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              onClick={() => onSelectWorkflow(workflow)}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-xl hover:border-white/50 transition-all duration-300 cursor-pointer hover:transform hover:scale-105 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-2 line-clamp-2">
                    {workflow.name}
                  </h3>
                  {workflow.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {workflow.description}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)} ml-3 flex-shrink-0`}>
                  {getStatusText(workflow.status)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Updated {new Date(workflow.updated_at).toLocaleDateString()}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleExportWorkflow(workflow.id, e)}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    title="Export workflow"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    title="Delete workflow"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 animate-in fade-in zoom-in-95">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this workflow does"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewWorkflowName('');
                  setNewWorkflowDescription('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Workflow Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Import Workflow</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Workflow File (JSON)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this workflow does"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
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
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportWorkflow}
                disabled={importing || !importFile || !importName.trim()}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowManager; 