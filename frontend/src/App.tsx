import React, { useState } from 'react';
import WorkflowManager from './components/WorkflowManager/WorkflowManager';
import WorkflowEditor from './components/WorkflowEditor';
import { Workflow, WorkflowStatus } from './types/workflow';

enum AppView {
  MANAGER = 'manager',
  EDITOR = 'editor'
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
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentView(AppView.MANAGER)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                currentView === AppView.MANAGER
                  ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/70 hover:shadow-md'
              }`}
            >
              {getViewIcon(AppView.MANAGER)}
              <span>Workflows</span>
            </button>
            
            <button
              onClick={() => setCurrentView(AppView.EDITOR)}
              disabled={!selectedWorkflow && currentView !== AppView.EDITOR}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 flex items-center space-x-2 ${
                currentView === AppView.EDITOR
                  ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg transform scale-105'
                  : selectedWorkflow
                  ? 'text-gray-700 hover:text-gray-900 hover:bg-white/70 hover:shadow-md'
                  : 'text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {getViewIcon(AppView.EDITOR)}
              <span>Editor</span>
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        {selectedWorkflow && (
          <div className="pb-4 flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{selectedWorkflow.name}</span>
            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
              selectedWorkflow.status === WorkflowStatus.ACTIVE 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                : selectedWorkflow.status === WorkflowStatus.DRAFT
                ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
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
        <main>
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export default App; 