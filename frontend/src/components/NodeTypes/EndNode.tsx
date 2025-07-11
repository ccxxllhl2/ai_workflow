import React from 'react';
import { Handle, Position } from 'reactflow';

interface EndNodeProps {
  data: {
    label: string;
    config: any;
  };
  selected?: boolean;
}

const EndNode: React.FC<EndNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-red-100 border-2 ${
      selected ? 'border-red-600' : 'border-red-300'
    }`}>
      {/* Target handles - can receive connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-red-500 border-2 border-white"
        id="top"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-red-500 border-2 border-white"
        id="left"
      />
      <Handle
        type="target"
        position={Position.Right}
        className="w-4 h-4 bg-red-500 border-2 border-white"
        id="right"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="w-4 h-4 bg-red-500 border-2 border-white"
        id="bottom"
      />
      
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-bold text-red-800">{data.label}</div>
          <div className="text-sm text-red-600">Workflow End</div>
        </div>
      </div>
      
      {/* Source handles - for completeness, though End nodes typically don't connect to others */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-red-500 border-2 border-white"
        id="bottom-out"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-4 h-4 bg-red-500 border-2 border-white"
        id="left-out"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-red-500 border-2 border-white"
        id="right-out"
      />
      <Handle
        type="source"
        position={Position.Top}
        className="w-4 h-4 bg-red-500 border-2 border-white"
        id="top-out"
      />
    </div>
  );
};

export default EndNode; 