import React from 'react';
import { Handle, Position } from 'reactflow';

interface AgentNodeProps {
  data: {
    label: string;
    config: any;
  };
  selected?: boolean;
  id: string;
}

const AgentNode: React.FC<AgentNodeProps> = ({ data, selected, id }) => {
  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('nodeConfig', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  return (
    <div className={`px-4 py-2 shadow-lg rounded-md bg-gradient-to-br from-purple-500 via-blue-600 to-cyan-500 border-2 ${
      selected ? 'border-cyan-300 shadow-cyan-300/50' : 'border-purple-300'
    } relative overflow-hidden`}>
      {/* Cyber background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-transparent to-cyan-400/20 animate-pulse"></div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gradient-to-r from-purple-400 to-cyan-400"
      />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="ml-2">
          <div className="text-lg font-bold text-white drop-shadow-lg">{data.label}</div>
          <div className="text-sm text-cyan-100">AI Agent</div>
        </div>
        <div className="flex items-center space-x-2">
          {/* AI Brain Icon */}
          <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              {/* Simplified AI Network Icon */}
              <circle cx="8" cy="8" r="2" fill="currentColor"/>
              <circle cx="16" cy="8" r="2" fill="currentColor"/>
              <circle cx="8" cy="16" r="2" fill="currentColor"/>
              <circle cx="16" cy="16" r="2" fill="currentColor"/>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
              <path d="M10 10L8 8M14 10L16 8M10 14L8 16M14 14L16 16" strokeWidth="2"/>
            </svg>
          </div>
          <button
            onClick={handleConfigClick}
            className="ml-2 p-1 text-cyan-200 hover:text-white hover:bg-white/20 rounded transition-all duration-200 backdrop-blur-sm"
            title="Configure Agent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gradient-to-r from-purple-400 to-cyan-400"
      />
    </div>
  );
};

export default AgentNode; 