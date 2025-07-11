import React, { useState, useEffect, useMemo } from 'react';
import { executionApi } from '../../services/api';
import { countTokens } from 'gpt-tokenizer';

interface HumanFeedbackProps {
  executionId: number;
  onContinue: (variables: Record<string, any>) => void;
  onClose: () => void;
  loading?: boolean;
  currentNodeName?: string;
  humanInterventionDescription?: string;
}

// Token counting utility
const getTokenCount = (text: string): number => {
  try {
    return countTokens(text);
  } catch (error) {
    console.warn('Token counting error:', error);
    return Math.ceil(text.length / 4); // Fallback estimation
  }
};

// Variable edit modal component with enhanced text editor style
const VariableEditModal: React.FC<{
  variableKey: string;
  variableValue: any;
  onSave: (key: string, value: any) => void;
  onClose: () => void;
}> = ({ variableKey, variableValue, onSave, onClose }) => {
  const [value, setValue] = useState(String(variableValue));

  // Dynamic token counting
  const tokenCount = useMemo(() => getTokenCount(value), [value]);

  const handleSave = () => {
    // Try to parse as number or keep as string
    let parsedValue: any = value;
    if (!isNaN(Number(value)) && value.trim() !== '') {
      parsedValue = Number(value);
    } else if (value.toLowerCase() === 'true') {
      parsedValue = true;
    } else if (value.toLowerCase() === 'false') {
      parsedValue = false;
    }
    onSave(variableKey, parsedValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full h-[95vh] mx-4 transform transition-all duration-300 animate-in fade-in zoom-in-95 flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header - Compact size */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <span className="text-2xl">📝</span>
                <span>Edit Variable</span>
              </h3>
              <div className="text-base text-gray-700 font-semibold bg-white px-3 py-1 rounded-full border border-gray-200">
                {variableKey}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-1 transition-all duration-200"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Tokens: {tokenCount} | Characters: {value.length}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-4 min-h-0 pb-2">
          <div className="h-full flex flex-col">
            <div className="flex-1 relative mb-4">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
                className="w-full h-full min-h-[450px] p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none font-mono text-base leading-relaxed bg-gray-50 focus:bg-white"
                placeholder={`Enter content for ${variableKey}...\n\nYou can write multiple lines of text here.\nThe content will be automatically formatted when saved.`}
              autoFocus
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                }}
            />
              <div className="absolute bottom-3 right-4 text-sm text-gray-400 bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-200">
                {value.length} chars | {tokenCount} tokens
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer - Clean */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl mt-4">
          <div className="flex justify-end">
            <div className="flex space-x-3">
          <button
            onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
          >
                Save Changes
          </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HumanFeedback: React.FC<HumanFeedbackProps> = ({ 
  executionId, 
  onContinue, 
  onClose, 
  loading: continueLoading = false, 
  currentNodeName = "Human Control",
  humanInterventionDescription = "Workflow paused, waiting for human intervention"
}) => {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [editingVariable, setEditingVariable] = useState<{key: string, value: any} | null>(null);

  useEffect(() => {
    loadVariables();
  }, [executionId]);

  const loadVariables = async () => {
    try {
      setLoading(true);
      const data = await executionApi.getExecutionVariables(executionId);
      setVariables(data.variables);
    } catch (err) {
      console.error('Failed to load variables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVariableEdit = (key: string, value: any) => {
    setEditingVariable({ key, value });
  };

  const handleVariableSave = (key: string, value: any) => {
    setVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleContinueExecution = async () => {
    try {
      await onContinue(variables);
    } catch (error) {
      console.error('Error continuing execution:', error);
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full mx-4 transform transition-all duration-300 animate-in fade-in zoom-in-95">
          <div className="text-center">
            <div className="text-8xl mb-6">📋</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Loading Variables</h2>
            <p className="text-gray-600 text-lg">Preparing your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full h-[95vh] overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95 flex flex-col">
        {/* Header - Reduced padding */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold flex items-center space-x-3 mb-1">
                <span>⏸️</span>
                <span>{currentNodeName}</span>
              </h2>
              <p className="text-orange-100 text-lg">{humanInterventionDescription}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-3 transition-all duration-200"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        {/* Main Content - Optimized spacing */}
        <div className="flex-1 p-6 min-h-0">
            <div className="h-full flex flex-col">
            {/* Variables Section Header - Reduced spacing */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center space-x-3">
                <span className="text-3xl">📝</span>
                <span>Variable Editor</span>
              </h3>
              <p className="text-gray-600">
                Review and modify your workflow variables. Click on any variable to edit its content.
              </p>
            </div>
            
            {/* Variables List - Row layout */}
            <div className="flex-1 overflow-y-auto">
              {Object.keys(variables).length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center py-16">
                    <div className="text-8xl mb-6">📭</div>
                    <h4 className="text-2xl font-bold text-gray-800 mb-3">No Variables Found</h4>
                    <p className="text-gray-600 text-lg">This workflow doesn't have any variables to edit.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(variables).map(([key, value]) => {
                    const tokenCount = getTokenCount(String(value));
                    const charCount = String(value).length;
                    
                    return (
                      <div
                    key={key}
                    onClick={() => handleVariableEdit(key, value)}
                        className="group bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-xl p-4 border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                          {/* Left side - Variable name and content preview */}
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="text-xl">📄</div>
                              <h4 className="font-bold text-lg text-gray-800 group-hover:text-blue-800 transition-colors">
                                {key}
                              </h4>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200 group-hover:border-blue-200 transition-colors">
                              <div className="text-gray-700 font-mono text-sm leading-relaxed truncate">
                                {typeof value === 'string' && value.length > 120 
                                  ? value.substring(0, 120) + '...' 
                            : String(value)
                          }
                        </div>
                            </div>
                          </div>
                          
                          {/* Right side - Stats and edit icon */}
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200 mb-1">
                                {charCount} chars
                              </div>
                              <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                {tokenCount} tokens
                        </div>
                      </div>
                            <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>

            {/* Continue Button - Reduced spacing */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleContinueExecution}
                  disabled={continueLoading}
                className={`w-full px-6 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-3 text-xl font-bold ${
                    continueLoading 
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  }`}
                >
                  {continueLoading ? (
                    <>
                    <div className="text-xl animate-bounce">🚀</div>
                    <span>Continuing Workflow...</span>
                    </>
                  ) : (
                    <>
                    <span className="text-xl">🚀</span>
                      <span>Continue Workflow</span>
                    </>
                  )}
                </button>
            </div>
          </div>
        </div>

        {/* Variable Edit Modal */}
        {editingVariable && (
          <VariableEditModal
            variableKey={editingVariable.key}
            variableValue={editingVariable.value}
            onSave={handleVariableSave}
            onClose={() => setEditingVariable(null)}
          />
        )}
      </div>
    </div>
  );
};

export default HumanFeedback; 