import React, { useState } from 'react';
import WorkflowManager from './components/WorkflowManager/WorkflowManager';
import WorkflowEditor from './components/WorkflowEditor';
import ExecutionView from './components/ExecutionView/ExecutionView';
import GlobalSettings from './components/GlobalSettings/GlobalSettings';
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
  const [showSettings, setShowSettings] = useState(false);

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

  const handleReturnToEditor = () => {
    if (selectedWorkflow) {
      setCurrentView(AppView.EDITOR);
    }
  };

  const getViewIcon = (view: AppView) => {
    switch (view) {
      case AppView.MANAGER:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case AppView.EDITOR:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case AppView.EXECUTION:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6-4h8m-12 8v3a2 2 0 002 2h8a2 2 0 002-2v-3" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderNavigation = () => (
    <div className="bg-white/95 backdrop-blur-lg border-b border-white/30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                AI Workflow
              </h1>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => setCurrentView(AppView.MANAGER)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                  currentView === AppView.MANAGER
                    ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-white/70 hover:shadow-md'
                }`}
              >
                {getViewIcon(AppView.MANAGER)}
                <span>Manager</span>
              </button>

              <button
                onClick={() => setCurrentView(AppView.EDITOR)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                  currentView === AppView.EDITOR
                    ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-white/70 hover:shadow-md'
                }`}
              >
                {getViewIcon(AppView.EDITOR)}
                <span>Editor</span>
              </button>

              <button
                onClick={() => setCurrentView(AppView.EXECUTION)}
                disabled={!selectedWorkflow}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                  currentView === AppView.EXECUTION
                    ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg transform scale-105'
                    : selectedWorkflow
                    ? 'text-gray-700 hover:text-gray-900 hover:bg-white/70 hover:shadow-md'
                    : 'text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                {getViewIcon(AppView.EXECUTION)}
                <span>Execution</span>
              </button>
            </div>
            
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="ml-4 p-2 text-gray-700 hover:text-gray-900 hover:bg-white/70 rounded-lg transition-all duration-300 hover:shadow-md"
              title="全局设置"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    const getViewAnimation = (view: AppView) => {
      // All views use the same fade-in animation for consistent experience
      return "animate-fade-in";
    };

    const viewContent = (() => {
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
            onReturnToEditor={handleReturnToEditor}
          />
        );
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Unknown View</h2>
              <p className="text-gray-600">Please select a valid view</p>
            </div>
          </div>
        );
    }
    })();

    return (
      <div className={getViewAnimation(currentView)}>
        {viewContent}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Grid background pattern */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      <div className="relative z-10">
        {renderNavigation()}
        <main className="flex-1">
          {renderCurrentView()}
        </main>
      </div>
      
      {/* Global Settings Modal */}
      <GlobalSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App; 