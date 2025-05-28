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
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
        );
      case AppView.EDITOR:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
          </svg>
        );
      case AppView.EXECUTION:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const renderNavigation = () => (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                AI Workflow
              </h1>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentView(AppView.MANAGER)}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                currentView === AppView.MANAGER
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {getViewIcon(AppView.MANAGER)}
              <span>工作流</span>
            </button>
            
            <button
              onClick={() => setCurrentView(AppView.EDITOR)}
              disabled={!selectedWorkflow && currentView !== AppView.EDITOR}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                currentView === AppView.EDITOR
                  ? 'bg-gray-900 text-white'
                  : selectedWorkflow
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              {getViewIcon(AppView.EDITOR)}
              <span>编辑器</span>
            </button>

            <button
              onClick={() => setCurrentView(AppView.EXECUTION)}
              disabled={!selectedWorkflow}
              className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center space-x-2 ${
                currentView === AppView.EXECUTION
                  ? 'bg-gray-900 text-white'
                  : selectedWorkflow
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              {getViewIcon(AppView.EXECUTION)}
              <span>执行</span>
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        {selectedWorkflow && (
          <div className="pb-4 flex items-center space-x-2 text-sm text-gray-500">
            <span className="font-medium text-gray-900">{selectedWorkflow.name}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              selectedWorkflow.status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : selectedWorkflow.status === 'draft'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
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
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">未知视图</h2>
              <p className="text-gray-600">请选择一个有效的视图</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}
      <main className="flex-1">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;
