import React from 'react';
import { Handle, Position } from 'reactflow';

interface IfNodeProps {
  data: {
    label: string;
    config: any;
  };
  selected?: boolean;
}

const IfNode: React.FC<IfNodeProps> = ({ data, selected }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 ${
      selected ? 'border-yellow-600' : 'border-yellow-300'
    } relative`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-yellow-500"
      />
      
      <div className="flex items-center">
        <div className="ml-2">
          <div className="text-lg font-bold text-yellow-800">{data.label}</div>
          <div className="text-sm text-yellow-600">Condition Branch</div>
        </div>
      </div>
      
      {/* True endpoint and label */}
      <div className="absolute bottom-0 left-1/4 transform -translate-x-1/2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="w-3 h-3 bg-green-500"
        />
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-600 bg-white px-1 rounded shadow">
          True
        </div>
      </div>
      
      {/* False endpoint and label */}
      <div className="absolute bottom-0 right-1/4 transform translate-x-1/2">
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="w-3 h-3 bg-red-500"
        />
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-600 bg-white px-1 rounded shadow">
          False
        </div>
      </div>
    </div>
  );
};

export default IfNode; 