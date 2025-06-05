import React, { useState, useEffect, useRef } from 'react';
import { executionApi } from '../../services/api';

interface HumanFeedbackProps {
  executionId: number;
  onContinue: (variables: Record<string, any>) => void;
  onClose: () => void;
  loading?: boolean;
  currentNodeName?: string;
  humanInterventionDescription?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Variable edit modal component
const VariableEditModal: React.FC<{
  variableKey: string;
  variableValue: any;
  onSave: (key: string, value: any) => void;
  onClose: () => void;
}> = ({ variableKey, variableValue, onSave, onClose }) => {
  const [value, setValue] = useState(String(variableValue));

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Edit Variable: {variableKey}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variable Value
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              rows={8}
              placeholder={`Enter value for ${variableKey}...`}
              autoFocus
            />
            <div className="mt-2 text-xs text-gray-500">
              Current type: {typeof variableValue} | Type will be auto-detected
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  // Variable edit related state
  const [editingVariable, setEditingVariable] = useState<{key: string, value: any} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadVariables();
  }, [executionId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      // The parent component (ExecutionView) will handle closing the modal
      // through setShowHumanFeedback(false) in handleContinueExecution
    } catch (error) {
      // If there's an error, we should still close the modal to allow user to see the error
      console.error('Error continuing execution:', error);
      onClose();
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setChatLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await executionApi.chatWithQwen(executionId, currentMessage);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat failed:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, chat service is temporarily unavailable. Please try again later.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-adjust textarea height
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⚡</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
            <p className="text-gray-600">Getting execution variables</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold flex items-center space-x-3">
                <span>⏸️</span>
                <span>{currentNodeName}</span>
              </h2>
              <p className="text-orange-100 mt-2 text-lg">{humanInterventionDescription}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-3 transition-colors"
            >
              <span className="text-3xl">✕</span>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-140px)]">
          {/* Left: Variable Editor */}
          <div className="w-1/3 p-6 border-r border-gray-200">
            <div className="h-full flex flex-col">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                <span>🔧</span>
                <span>Variable Editor</span>
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {Object.entries(variables).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleVariableEdit(key, value)}
                    className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-4 border border-gray-200 text-left transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 mb-1">{key}</div>
                        <div className="text-sm text-gray-600 truncate">
                          {typeof value === 'string' && value.length > 50 
                            ? value.substring(0, 50) + '...' 
                            : String(value)
                          }
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Type: {typeof value}
                        </div>
                      </div>
                      <div className="text-gray-400 ml-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
                
                {Object.keys(variables).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-lg">No variables</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleContinueExecution}
                  disabled={continueLoading}
                  className={`flex-1 px-6 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 text-lg font-semibold ${
                    continueLoading 
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  }`}
                >
                  {continueLoading ? (
                    <>
                      <div className="animate-spin text-lg">⚡</div>
                      <span>Continuing...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Continue Workflow</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: AI Chat */}
          <div className="w-2/3 p-6">
            <div className="h-full flex flex-col">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                <span>🤖</span>
                <span>AI Assistant</span>
              </h3>
              
              <div className="flex-1 bg-gray-50 rounded-xl p-6 mb-6 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="text-lg">Start a conversation with AI assistant</p>
                      <p className="text-sm mt-2">You can ask questions about workflow variables or any help</p>
                    </div>
                  )}
                  
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-4 ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                      }`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-800 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin text-sm">⚡</div>
                          <span>AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>
                
                <div className="flex space-x-3 items-end">
                  <textarea
                    value={currentMessage}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Shift+Enter for new line, Enter to send)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none min-h-[50px] max-h-[200px] text-sm"
                    disabled={chatLoading}
                    ref={textareaRef}
                    rows={1}
                    style={{ height: 'auto' }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={chatLoading || !currentMessage.trim()}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center justify-center font-medium"
                  >
                    {chatLoading ? (
                      <div className="animate-spin text-sm">⚡</div>
                    ) : (
                      <span>Send</span>
                    )}
                  </button>
                </div>
              </div>
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