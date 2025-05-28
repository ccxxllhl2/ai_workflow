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
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-bold text-green-800">{data.label}</div>
          <div className="text-sm text-green-600">Workflow Start</div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500"
      />
    </div>
  );
};

export default StartNode; 