import React from 'react';
import { Handle, Position } from 'reactflow';

interface StartNodeProps {
  data: {
    label: string;
    config: any;
  };
  selected?: boolean;
}

const StartNode: React.FC<StartNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-green-100 border-2 ${
      selected ? 'border-green-600' : 'border-green-300'
    }`}>
      {/* Target handles - can receive connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-green-500 border-2 border-white"
        id="top"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-green-500 border-2 border-white"
        id="left"
      />
      <Handle
        type="target"
        position={Position.Right}
        className="w-4 h-4 bg-green-500 border-2 border-white"
        id="right"
      />
      
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-bold text-green-800">{data.label}</div>
          <div className="text-sm text-green-600">Workflow Start</div>
        </div>
      </div>
      
      {/* Source handles - can create connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-green-500 border-2 border-white"
        id="bottom"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-4 h-4 bg-green-500 border-2 border-white"
        id="left-out"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-green-500 border-2 border-white"
        id="right-out"
      />
      <Handle
        type="source"
        position={Position.Top}
        className="w-4 h-4 bg-green-500 border-2 border-white"
        id="top-out"
      />
    </div>
  );
};

export default StartNode; 