import React, { useState } from 'react';
import { Variable } from '../../utils/variableExtractor';
import { NodeType } from '../../types/workflow';

interface VariablePanelProps {
  variables: Variable[];
  isOpen: boolean;
  onToggle: () => void;
}

const VariablePanel: React.FC<VariablePanelProps> = ({ variables, isOpen, onToggle }) => {
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const handleVariableClick = async (variableName: string) => {
    const jinjaText = `{{${variableName}}}`;
    
    try {
      await navigator.clipboard.writeText(jinjaText);
      setCopiedVariable(variableName);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedVariable(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: try to insert into focused input element
      const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        const start = activeElement.selectionStart || 0;
        const end = activeElement.selectionEnd || 0;
        const value = activeElement.value;
        const newValue = value.substring(0, start) + jinjaText + value.substring(end);
        activeElement.value = newValue;
        
        // Trigger input event to update React state
        const event = new Event('input', { bubbles: true });
        activeElement.dispatchEvent(event);
        
        // Set cursor position after inserted text
        const newCursorPos = start + jinjaText.length;
        activeElement.setSelectionRange(newCursorPos, newCursorPos);
        activeElement.focus();
        
        setCopiedVariable(variableName);
        setTimeout(() => {
          setCopiedVariable(null);
        }, 2000);
      }
    }
  };
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
      case NodeType.HUMAN_CONTROL:
        return (
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
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
                         onClick={() => handleVariableClick(variable.name)}
                         className={`group flex items-center justify-between p-3 bg-white rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md hover:border-blue-300 ${
                           copiedVariable === variable.name 
                             ? 'border-green-300 bg-green-50' 
                             : 'border-gray-200 hover:bg-blue-50'
                         }`}
                         title={copiedVariable === variable.name ? 'Copied to clipboard!' : 'Click to copy Jinja2 syntax'}>
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {copiedVariable === variable.name ? (
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <code className={`text-sm font-mono truncate block ${
                            copiedVariable === variable.name 
                              ? 'text-green-800' 
                              : 'text-gray-900 group-hover:text-blue-900'
                          }`}>
                          {variable.name}
                        </code>
                          <div className={`text-xs font-mono truncate ${
                            copiedVariable === variable.name 
                              ? 'text-green-600' 
                              : 'text-gray-500 group-hover:text-blue-600'
                          }`}>
                            {copiedVariable === variable.name ? 'Copied!' : `{{${variable.name}}}`}
                          </div>
                        </div>
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
        <div className="text-xs text-gray-500 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span>Total Variables:</span>
            <span className="font-medium">{variables.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Nodes:</span>
            <span className="font-medium">{Object.keys(groupedVariables).length}</span>
          </div>
        </div>
        
        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Click to Use</p>
              <p>Click any variable to copy its Jinja2 syntax to clipboard or auto-insert into focused input field.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariablePanel; 