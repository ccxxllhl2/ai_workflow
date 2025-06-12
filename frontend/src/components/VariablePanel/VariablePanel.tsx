import React from 'react';
import { Variable } from '../../utils/variableExtractor';
import { NodeType } from '../../types/workflow';

interface VariablePanelProps {
  variables: Variable[];
  isOpen: boolean;
  onToggle: () => void;
}

const VariablePanel: React.FC<VariablePanelProps> = ({ variables, isOpen, onToggle }) => {
  const getNodeTypeIcon = (nodeType: NodeType) => {
    switch (nodeType) {
      case NodeType.START:
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
          </svg>
        );
      case NodeType.AGENT:
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
          </svg>
        );
      case NodeType.JIRA:
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129V13.1a5.218 5.218 0 0 0 5.232-5.215V6.782a1.024 1.024 0 0 0-1.018-1.025zM23.013.592H11.455a5.215 5.215 0 0 0 5.215 5.214h2.129V7.863a5.218 5.218 0 0 0 5.232-5.215V1.617A1.024 1.024 0 0 0 23.013.592z"/>
          </svg>
        );
      case NodeType.CONFLUENCE:
        return (
          <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.87 19.492c.494 1.516 1.528 2.594 3.01 3.14.49.18.995.252 1.528.22 1.51-.09 2.84-.99 3.61-2.45l4.75-9.03c1.21-2.3 3.99-3.19 6.29-1.98 2.3 1.21 3.19 3.99 1.98 6.29l-1.65 3.14c-.15.29-.03.65.26.8.29.15.65.03.8-.26l1.65-3.14c1.8-3.42.37-7.71-3.05-9.51-3.42-1.8-7.71-.37-9.51 3.05L4.77 18.832c-.54 1.02-1.47 1.65-2.53 1.71-.36.02-.71-.03-1.07-.15-1.04-.38-1.78-1.14-2.15-2.2-.15-.42-.05-.87.32-1.02.37-.15.83-.03.98.35zm22.26-14.98c-.49-1.516-1.528-2.594-3.01-3.14-.49-.18-.995-.252-1.528-.22-1.51.09-2.84.99-3.61 2.45l-4.75 9.03c-1.21 2.3-3.99 3.19-6.29 1.98-2.3-1.21-3.19-3.99-1.98-6.29l1.65-3.14c.15-.29.03-.65-.26-.8-.29-.15-.65-.03-.8.26l-1.65 3.14c-1.8 3.42-.37 7.71 3.05 9.51 3.42 1.8 7.71.37 9.51-3.05L19.23 5.168c.54-1.02 1.47-1.65 2.53-1.71.36-.02.71.03 1.07.15 1.04.38 1.78 1.14 2.15 2.2.15.42.05.87-.32 1.02-.37.15-.83.03-.98-.35z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
          </svg>
        );
    }
  };

  const getSourceBadge = (source: 'output' | 'initial') => {
    if (source === 'initial') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Initial
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Output
        </span>
      );
    }
  };

  const groupedVariables = variables.reduce((groups, variable) => {
    const key = variable.nodeId;
    if (!groups[key]) {
      groups[key] = {
        nodeId: variable.nodeId,
        nodeLabel: variable.nodeLabel,
        nodeType: variable.nodeType,
        variables: []
      };
    }
    groups[key].variables.push(variable);
    return groups;
  }, {} as Record<string, { nodeId: string; nodeLabel: string; nodeType: NodeType; variables: Variable[] }>);

  return (
    <div className={`fixed right-0 top-0 h-full bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 z-40 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`} style={{ width: '320px' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Variables</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {variables.length}
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {variables.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">No Variables</h4>
            <p className="text-xs text-gray-600">Variables will appear here after you define them in nodes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(groupedVariables).map((group) => (
              <div key={group.nodeId} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-3">
                  {getNodeTypeIcon(group.nodeType)}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {group.nodeLabel}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {group.variables.map((variable, index) => (
                    <div key={`${variable.nodeId}-${variable.name}-${index}`} 
                         className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <code className="text-sm font-mono text-gray-900 truncate">
                          {variable.name}
                        </code>
                      </div>
                      <div className="flex-shrink-0">
                        {getSourceBadge(variable.source)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="text-xs text-gray-500">
          <div className="flex items-center justify-between mb-1">
            <span>Total Variables:</span>
            <span className="font-medium">{variables.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Nodes:</span>
            <span className="font-medium">{Object.keys(groupedVariables).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariablePanel; 