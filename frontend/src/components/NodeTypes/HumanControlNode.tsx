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
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500"
      />
      
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-bold text-purple-800">{data.label}</div>
          <div className="text-sm text-purple-600">Human Control</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500"
      />
    </div>
  );
};

export default HumanControlNode; 