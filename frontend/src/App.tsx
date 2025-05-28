import React, { useState } from 'react';
import WorkflowManager from './components/WorkflowManager/WorkflowManager';
import WorkflowEditor from './components/WorkflowEditor';
import ExecutionView from './components/ExecutionView/ExecutionView';
import { Workflow } from './types/workflow';
import './App.css';

enum AppView {
  MANAGER = 'manager',
  EDITOR = 'editor',
  EXECUTION = 'execution'
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.MANAGER);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const handleSelectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setCurrentView(AppView.EDITOR);
  };

  const handleCreateNewWorkflow = () => {
    setSelectedWorkflow(null);
    setCurrentView(AppView.EDITOR);
  };

  const handleWorkflowSave = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
  };

  const handleViewExecution = () => {
    if (selectedWorkflow) {
      setCurrentView(AppView.EXECUTION);
    }
  };

  const getViewIcon = (view: AppView) => {
    switch (view) {
      case AppView.MANAGER:
        return '📋';
      case AppView.EDITOR:
        return '⚡';
      case AppView.EXECUTION:
        return '🚀';
      default:
        return '❓';
    }
  };

  const renderNavigation = () => (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="text-3xl">🤖</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Workflow Platform
              </h1>
              <p className="text-sm text-gray-500">Intelligent Workflow Design & Execution Platform</p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView(AppView.MANAGER)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                currentView === AppView.MANAGER
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform -translate-y-0.5'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              <span className="text-lg">{getViewIcon(AppView.MANAGER)}</span>
              <span>Workflow Manager</span>
            </button>
            
            <button
              onClick={() => setCurrentView(AppView.EDITOR)}
              disabled={!selectedWorkflow && currentView !== AppView.EDITOR}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                currentView === AppView.EDITOR
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg transform -translate-y-0.5'
                  : selectedWorkflow
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="text-lg">{getViewIcon(AppView.EDITOR)}</span>
              <span>Editor</span>
              {selectedWorkflow && (
                <span className="ml-2 px-2 py-1 bg-white bg-opacity-20 text-xs rounded-lg">
                  {selectedWorkflow.name}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {selectedWorkflow && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
            <span>📁</span>
            <span>Current Workflow:</span>
            <span className="font-medium text-blue-600">{selectedWorkflow.name}</span>
            <span className="text-gray-400">•</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs">
              {selectedWorkflow.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case AppView.MANAGER:
        return (
          <WorkflowManager
            onSelectWorkflow={handleSelectWorkflow}
            onCreateNewWorkflow={handleCreateNewWorkflow}
          />
        );
      case AppView.EDITOR:
        return (
          <WorkflowEditor
            workflow={selectedWorkflow}
            onSave={handleWorkflowSave}
            onViewExecution={handleViewExecution}
          />
        );
      case AppView.EXECUTION:
        return (
          <ExecutionView
            workflowId={selectedWorkflow?.id}
          />
        );
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="text-6xl mb-4">❓</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Unknown View</h2>
              <p className="text-gray-600">Please select a valid view</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {renderNavigation()}
      <div className="flex-1">
        {renderCurrentView()}
      </div>
    </div>
  );
}

export default App;
