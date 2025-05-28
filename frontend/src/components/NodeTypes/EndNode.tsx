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
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-red-500"
      />
      
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-bold text-red-800">{data.label}</div>
          <div className="text-sm text-red-600">Workflow End</div>
        </div>
      </div>
    </div>
  );
};

export default EndNode; 