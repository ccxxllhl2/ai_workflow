import React from 'react';
import { Handle, Position } from 'reactflow';

interface HumanControlNodeProps {
  data: {
    label: string;
    config: any;
  };
  selected?: boolean;
}

const HumanControlNode: React.FC<HumanControlNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 ${
      selected ? 'border-purple-600' : 'border-purple-300'
    }`}>
      {/* Target handles - can receive connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-purple-500 border-2 border-white"
        id="top"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-purple-500 border-2 border-white"
        id="left"
      />
      <Handle
        type="target"
        position={Position.Right}
        className="w-4 h-4 bg-purple-500 border-2 border-white"
        id="right"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="w-4 h-4 bg-purple-500 border-2 border-white"
        id="bottom-in"
      />
      
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-bold text-purple-800">{data.label}</div>
          <div className="text-sm text-purple-600">Human Control</div>
        </div>
      </div>
      
      {/* Source handles - can create connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-4 h-4 bg-purple-500 border-2 border-white"
        id="bottom"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-4 h-4 bg-purple-500 border-2 border-white"
        id="left-out"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-purple-500 border-2 border-white"
        id="right-out"
      />
      <Handle
        type="source"
        position={Position.Top}
        className="w-4 h-4 bg-purple-500 border-2 border-white"
        id="top-out"
      />
    </div>
  );
};

export default HumanControlNode; 