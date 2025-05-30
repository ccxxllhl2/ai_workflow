import React, { useState, useEffect, useCallback } from 'react';
import { Execution, ExecutionStatus } from '../../types/workflow';
import { executionApi } from '../../services/api';
import HumanFeedback from './HumanFeedback';

interface ExecutionViewProps {
  workflowId?: number;
  onReturnToEditor?: () => void;
}

interface FinalOutput {
  execution_id: number;
  final_output: any;
  has_output: boolean;
}

const ExecutionView: React.FC<ExecutionViewProps> = ({ workflowId, onReturnToEditor }) => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [finalOutput, setFinalOutput] = useState<FinalOutput | null>(null);
  const [loadingFinalOutput, setLoadingFinalOutput] = useState(false);
  const [showHumanFeedback, setShowHumanFeedback] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedVariables, setExpandedVariables] = useState<Record<string, boolean>>({});

  const loadExecutions = useCallback(async () => {
    if (!workflowId) return;

    try {
      setLoading(true);
      const data = await executionApi.getExecutions(workflowId);
      setExecutions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load execution records');
      console.error('Failed to load execution records:', err);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

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

  const loadExecutionHistory = useCallback(async (executionId: number) => {
    try {
      setLoadingHistory(true);
      const response = await executionApi.getExecutionHistory(executionId);
      setExecutionHistory(response.history);
      setExpandedVariables({});
    } catch (err) {
      console.error('Failed to load execution history:', err);
      setExecutionHistory([]);
      setExpandedVariables({});
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (workflowId) {
      loadExecutions();
    }
  }, [workflowId, loadExecutions]);

  useEffect(() => {
    if (selectedExecution) {
      loadFinalOutput(selectedExecution.id);
      loadExecutionHistory(selectedExecution.id);
    }
  }, [selectedExecution, loadFinalOutput, loadExecutionHistory]);

  const handleExecuteWorkflow = async () => {
    if (!workflowId) return;

    try {
      const execution = await executionApi.executeWorkflow(workflowId);
      setExecutions([execution, ...executions]);
      setSelectedExecution(execution);
      
      // Poll execution status
      pollExecutionStatus(execution.id);
    } catch (err) {
      alert('Failed to start execution');
      console.error('Failed to start execution:', err);
    }
  };

  const pollExecutionStatus = async (executionId: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const execution = await executionApi.getExecution(executionId);
        
        // Update execution records
        setExecutions(prev => 
          prev.map(e => e.id === executionId ? execution : e)
        );
        
        if (selectedExecution?.id === executionId) {
          setSelectedExecution(execution);
        }

        // If execution completed, stop polling and reload final output
        if (execution.status === ExecutionStatus.COMPLETED || 
            execution.status === ExecutionStatus.FAILED) {
          clearInterval(pollInterval);
          if (selectedExecution?.id === executionId) {
            loadFinalOutput(executionId);
          }
        }
      } catch (err) {
        console.error('Failed to get execution status:', err);
        clearInterval(pollInterval);
      }
    }, 1000);

    // Stop polling after 30 seconds
    setTimeout(() => clearInterval(pollInterval), 30000);
  };

  const handleDeleteExecution = async (executionId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering execution record selection
    
    if (!window.confirm('Are you sure you want to delete this execution record? This action cannot be undone.')) {
      return;
    }

    try {
      await executionApi.deleteExecution(executionId);
      setExecutions(prev => prev.filter(e => e.id !== executionId));
      
      // If deleting the currently selected execution record, clear selection
      if (selectedExecution?.id === executionId) {
        setSelectedExecution(null);
        setFinalOutput(null);
      }
    } catch (err) {
      alert('Failed to delete execution record');
      console.error('Failed to delete execution record:', err);
    }
  };

  const handleShowHumanFeedback = () => {
    if (selectedExecution?.status === ExecutionStatus.PAUSED) {
      setShowHumanFeedback(true);
    }
  };

  const handleContinueExecution = async (variables: Record<string, any>) => {
    if (!selectedExecution || continueLoading) return;

    setContinueLoading(true);
    
    try {
      console.log('Sending continue execution request...', { executionId: selectedExecution.id, variables });
      
      const result = await executionApi.continueExecution(selectedExecution.id, { variables });
      
      console.log('Continue execution response:', result);
      
      setShowHumanFeedback(false);
      
      // Immediately update local state
      setSelectedExecution(result);
      setExecutions(prev => 
        prev.map(e => e.id === selectedExecution.id ? result : e)
      );
      
      // Only show success message when truly successful
      console.log('Workflow continued execution successfully, status:', result.status);
      
      // Restart polling
      pollExecutionStatus(selectedExecution.id);
      
      // Restart workflow editor polling if available
      if ((window as any).restartWorkflowPolling) {
        (window as any).restartWorkflowPolling(selectedExecution.id);
      }
    } catch (err: any) {
      console.error('Continue execution exception occurred:', err);
      
      // Only show error message when truly error occurred
      // Check if it's a network error or real server error
      if (err.response && err.response.status >= 400) {
        const errorMessage = err.response.data?.detail || 'Failed to continue execution';
        alert(`Error: ${errorMessage}`);
      } else if (!err.response) {
        alert('Network error: Cannot connect to server');
      }
      // Other cases might be normal behavior of async operations, don't show error
    } finally {
      setContinueLoading(false);
    }
  };

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.PENDING:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case ExecutionStatus.RUNNING:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case ExecutionStatus.PAUSED:
        return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
      case ExecutionStatus.COMPLETED:
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case ExecutionStatus.FAILED:
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
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

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m${duration % 60}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h${minutes}m`;
    }
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
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Execution Manager
            </h1>
            <p className="text-gray-600 mt-2">Monitor and manage workflow execution status</p>
          </div>
          <div className="flex space-x-3">
            {onReturnToEditor && (
              <button
                onClick={onReturnToEditor}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Back to Workflow</span>
              </button>
            )}
            <button
              onClick={handleExecuteWorkflow}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <span>🚀</span>
              <span>Start Execution</span>
            </button>
            <button
              onClick={loadExecutions}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Execution List */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <span>📋</span>
                  <span>Execution History</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {executions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">📝</div>
                      <p>No execution records yet</p>
                    </div>
                  ) : (
                    executions.map((execution) => (
                      <div
                        key={execution.id}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 ${
                          selectedExecution?.id === execution.id 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 shadow-lg' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                        onClick={() => setSelectedExecution(execution)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getStatusIcon(execution.status)}</span>
                            <div>
                              <span className="font-bold text-gray-800">Execution #{execution.id}</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                                  {execution.status}
                                </div>
                                {execution.status === ExecutionStatus.PAUSED && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedExecution(execution);
                                      setShowHumanFeedback(true);
                                    }}
                                    className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                                  >
                                    Human Feedback
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500 bg-white px-2 py-1 rounded-lg">
                              {formatDuration(execution.started_at, execution.completed_at)}
                            </div>
                            <button
                              onClick={(e) => handleDeleteExecution(execution.id, e)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1 transition-colors"
                              title="Delete execution record"
                            >
                              <span className="text-lg">🗑️</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span>🕐</span>
                            <span>Started: {formatDate(execution.started_at)}</span>
                          </div>
                          {execution.completed_at && (
                            <div className="flex items-center space-x-2">
                              <span>🏁</span>
                              <span>Completed: {formatDate(execution.completed_at)}</span>
                            </div>
                          )}
                        </div>

                        {execution.error_message && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <div className="flex items-center space-x-2">
                              <span>❌</span>
                              <span>Error: {execution.error_message}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Execution Details */}
          <div className="xl:col-span-2">
            {selectedExecution ? (
              <div className="space-y-6">
                {/* Basic Information Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold flex items-center space-x-2">
                        <span>📊</span>
                        <span>Execution Details</span>
                      </h2>
                      {selectedExecution.status === ExecutionStatus.PAUSED && (
                        <button
                          onClick={handleShowHumanFeedback}
                          className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2"
                        >
                          <span>⏸️</span>
                          <span>Human Feedback</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🆔</span>
                          <div>
                            <span className="text-gray-500 text-sm">Execution ID</span>
                            <div className="font-bold text-lg">{selectedExecution.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getStatusIcon(selectedExecution.status)}</span>
                          <div>
                            <span className="text-gray-500 text-sm">Status</span>
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedExecution.status)}`}>
                              {selectedExecution.status}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🕐</span>
                          <div>
                            <span className="text-gray-500 text-sm">Start Time</span>
                            <div className="font-medium">{formatDate(selectedExecution.started_at)}</div>
                          </div>
                        </div>
                        {selectedExecution.completed_at && (
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">🏁</span>
                            <div>
                              <span className="text-gray-500 text-sm">Completion Time</span>
                              <div className="font-medium">{formatDate(selectedExecution.completed_at)}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedExecution.current_node && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">⚡</span>
                          <span className="font-medium text-blue-800">Current Node: {selectedExecution.current_node}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Output Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    <h2 className="text-xl font-bold flex items-center space-x-2">
                      <span>🎯</span>
                      <span>Final Output</span>
                    </h2>
                  </div>
                  <div className="p-6">
                    {loadingFinalOutput ? (
                      <div className="text-center py-8">
                        <div className="animate-spin text-4xl mb-4">⚡</div>
                        <p className="text-gray-600">Loading final output...</p>
                      </div>
                    ) : finalOutput?.has_output ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xl">✨</span>
                            <span className="font-medium text-emerald-800">Execution Result</span>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-emerald-200 font-mono text-sm">
                            {typeof finalOutput.final_output === 'string' 
                              ? finalOutput.final_output 
                              : JSON.stringify(finalOutput.final_output, null, 2)
                            }
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">📭</div>
                        <p>No final output yet</p>
                        <p className="text-sm mt-2">Workflow may not be completed or no output configured</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow History Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div 
                    className="p-6 bg-gradient-to-r from-purple-500 to-violet-600 text-white cursor-pointer"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold flex items-center space-x-2">
                        <span>📜</span>
                        <span>Workflow Execution History</span>
                      </h2>
                      <svg 
                        className={`w-6 h-6 transform transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  {showHistory && (
                    <div className="p-6">
                      {loadingHistory ? (
                        <div className="text-center py-8">
                          <div className="animate-spin text-4xl mb-4">⚡</div>
                          <p className="text-gray-600">Loading execution history...</p>
                        </div>
                      ) : executionHistory.length > 0 ? (
                        <div className="space-y-4">
                          {executionHistory.map((historyItem, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    historyItem.status === 'completed' ? 'bg-green-500' :
                                    historyItem.status === 'paused' ? 'bg-yellow-500' :
                                    historyItem.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                                  }`}></div>
                                  <span className="font-semibold text-gray-800">
                                    {historyItem.node_name || historyItem.node_id} ({historyItem.node_type})
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <span>{formatDate(historyItem.started_at)}</span>
                                  {historyItem.duration && historyItem.duration > 0 && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {historyItem.duration.toFixed(1)}s
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Variables Snapshot */}
                              {historyItem.variables_snapshot && Object.keys(historyItem.variables_snapshot).length > 0 && (
                                <div className="mb-3">
                                  <div className="text-sm font-medium text-gray-700 mb-2">Variables at execution time:</div>
                                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                    <div className="space-y-2">
                                      {Object.entries(historyItem.variables_snapshot).map(([key, value]) => {
                                        const valueString = typeof value === 'string' ? value : JSON.stringify(value);
                                        const isLongContent = valueString.length > 100;
                                        
                                        return (
                                          <div key={key} className="bg-white p-2 rounded border border-blue-200">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="font-medium text-blue-800 text-sm">{key}:</span>
                                              {isLongContent && (
                                                <button
                                                  onClick={() => setExpandedVariables(prev => ({ 
                                                    ...prev, 
                                                    [`${index}-${key}`]: !prev[`${index}-${key}`] 
                                                  }))}
                                                  className="text-xs text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                                                >
                                                  {expandedVariables[`${index}-${key}`] ? 'Collapse' : 'Expand'}
                                                </button>
                                              )}
                                            </div>
                                            <div className="text-blue-600 text-sm font-mono break-words">
                                              {isLongContent && !expandedVariables[`${index}-${key}`] 
                                                ? `${valueString.substring(0, 100)}...` 
                                                : valueString
                                              }
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Agent Conversation */}
                              {historyItem.node_type === 'agent' && historyItem.agent_prompt && historyItem.agent_response && (
                                <div className="mb-3">
                                  <div className="text-sm font-medium text-gray-700 mb-2">AI Agent Conversation:</div>
                                  <div className="space-y-3">
                                    {/* User Prompt */}
                                    <div className="flex justify-end">
                                      <div className="max-w-xs lg:max-w-md bg-blue-500 text-white rounded-lg px-4 py-2">
                                        <div className="text-xs text-blue-100 mb-1">Prompt Input</div>
                                        <div className="text-sm">{historyItem.agent_prompt}</div>
                                      </div>
                                    </div>
                                    {/* AI Response */}
                                    <div className="flex justify-start">
                                      <div className="max-w-xs lg:max-w-md bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
                                        <div className="text-xs text-gray-600 mb-1">AI Response</div>
                                        <div className="text-sm">{historyItem.agent_response}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Human Control Chat History */}
                              {historyItem.node_type === 'human_control' && historyItem.chat_history && historyItem.chat_history.length > 0 && (
                                <div className="mb-3">
                                  <div className="text-sm font-medium text-gray-700 mb-2">Human-AI Chat History:</div>
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {historyItem.chat_history.map((chat: any, chatIndex: number) => (
                                      <div key={chatIndex} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs lg:max-w-md rounded-lg px-3 py-2 ${
                                          chat.role === 'user' 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-gray-200 text-gray-800'
                                        }`}>
                                          <div className={`text-xs mb-1 ${
                                            chat.role === 'user' ? 'text-blue-100' : 'text-gray-600'
                                          }`}>
                                            {chat.role === 'user' ? 'You' : 'AI Assistant'} - {formatDate(chat.timestamp)}
                                          </div>
                                          <div className="text-sm">{chat.content}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Regular Output */}
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <div className="text-sm font-medium text-gray-700 mb-1">Output:</div>
                                <div className="text-sm text-gray-600 font-mono">
                                  {historyItem.output || historyItem.error_message || 'No output'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-4">📋</div>
                          <p>No execution history available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Execution Variables Card */}
                {selectedExecution.variables && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                      <h2 className="text-xl font-bold flex items-center space-x-2">
                        <span>🔧</span>
                        <span>Execution Variables</span>
                      </h2>
                    </div>
                    <div className="p-6">
                      <pre className="text-sm bg-gray-50 p-4 rounded-xl overflow-auto max-h-64 border border-gray-200 font-mono">
                        {JSON.stringify(JSON.parse(selectedExecution.variables), null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Error Information Card */}
                {selectedExecution.error_message && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-red-500 to-pink-600 text-white">
                      <h2 className="text-xl font-bold flex items-center space-x-2">
                        <span>⚠️</span>
                        <span>Error Information</span>
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 font-mono text-sm">
                        {selectedExecution.error_message}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-12 text-center text-gray-500">
                  <div className="text-6xl mb-6">👆</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Select Execution Record</h3>
                  <p>Click on the execution record on the left to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Human Feedback Dialog */}
      {showHumanFeedback && selectedExecution && (
        <HumanFeedback
          executionId={selectedExecution.id}
          onContinue={handleContinueExecution}
          onClose={() => setShowHumanFeedback(false)}
          loading={continueLoading}
          currentNodeName={selectedExecution.current_node || "Human Control"}
        />
      )}
    </div>
  );
};

export default ExecutionView; 