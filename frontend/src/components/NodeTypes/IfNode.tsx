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
      {/* Target handles - can receive connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-4 h-4 bg-yellow-500 border-2 border-white"
        id="top"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-4 h-4 bg-yellow-500 border-2 border-white"
        id="left"
      />
      <Handle
        type="target"
        position={Position.Right}
        className="w-4 h-4 bg-yellow-500 border-2 border-white"
        id="right"
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
          className="w-4 h-4 bg-green-500 border-2 border-white"
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
          className="w-4 h-4 bg-red-500 border-2 border-white"
        />
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-600 bg-white px-1 rounded shadow">
          False
        </div>
      </div>
      
      {/* Additional source handles for flexibility */}
      <Handle
        type="source"
        position={Position.Left}
        className="w-4 h-4 bg-yellow-500 border-2 border-white"
        id="left-out"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-4 h-4 bg-yellow-500 border-2 border-white"
        id="right-out"
      />
      <Handle
        type="source"
        position={Position.Top}
        className="w-4 h-4 bg-yellow-500 border-2 border-white"
        id="top-out"
      />
    </div>
  );
};

export default IfNode; 