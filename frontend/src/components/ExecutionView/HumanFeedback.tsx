import React, { useState, useEffect, useRef } from 'react';
import { executionApi } from '../../services/api';

interface HumanFeedbackProps {
  executionId: number;
  onContinue: (variables: Record<string, any>) => void;
  onClose: () => void;
  loading?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const HumanFeedback: React.FC<HumanFeedbackProps> = ({ executionId, onContinue, onClose, loading: continueLoading = false }) => {
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const handleVariableChange = (key: string, value: string) => {
    // Try to parse as number or keep as string
    let parsedValue: any = value;
    if (!isNaN(Number(value)) && value.trim() !== '') {
      parsedValue = Number(value);
    } else if (value.toLowerCase() === 'true') {
      parsedValue = true;
    } else if (value.toLowerCase() === 'false') {
      parsedValue = false;
    }

    setVariables(prev => ({
      ...prev,
      [key]: parsedValue
    }));
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <span>⏸️</span>
                <span>Human Feedback</span>
              </h2>
              <p className="text-orange-100 mt-1">Workflow paused, waiting for human intervention</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left: Variable Editor */}
          <div className="w-1/2 p-6 border-r border-gray-200">
            <div className="h-full flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <span>🔧</span>
                <span>Variable Editor</span>
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => handleVariableChange(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder={`Enter value for ${key}`}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Current type: {typeof value}
                    </div>
                  </div>
                ))}
                
                {Object.keys(variables).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📭</div>
                    <p>No variables</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => onContinue(variables)}
                  disabled={continueLoading}
                  className={`flex-1 px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 ${
                    continueLoading 
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                  }`}
                >
                  {continueLoading ? (
                    <>
                      <div className="animate-spin text-sm">⚡</div>
                      <span>Continuing...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Continue Execution</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Right: AI Chat */}
          <div className="w-1/2 p-6">
            <div className="h-full flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <span>🤖</span>
                <span>AI Assistant</span>
              </h3>
              
              <div className="flex-1 bg-gray-50 rounded-xl p-4 mb-4 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">💬</div>
                      <p>Start a conversation with AI assistant</p>
                      <p className="text-sm mt-2">You can ask questions about workflow variables or any help</p>
                    </div>
                  )}
                  
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-800 rounded-xl p-3">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin text-sm">⚡</div>
                          <span>AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={chatLoading || !currentMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanFeedback; 