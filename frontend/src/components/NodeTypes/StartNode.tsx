import React from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

interface StartNodeProps {
  data: {
    label: string;
    config: any;
  };
  selected?: boolean;
  id: string;
}

const StartNode: React.FC<StartNodeProps> = ({ data, selected, id }) => {
  const { getNode, setNodes } = useReactFlow();

  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 触发双击事件来打开配置面板
    const node = getNode(id);
    if (node) {
      // 发送自定义事件通知父组件打开配置面板
      const event = new CustomEvent('nodeConfig', { detail: { nodeId: id } });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-green-100 border-2 ${
      selected ? 'border-green-600' : 'border-green-300'
    }`}>
      <div className="flex items-center justify-between">
        <div className="ml-2">
          <div className="text-lg font-bold text-green-800">{data.label}</div>
          <div className="text-sm text-green-600">Workflow Start</div>
        </div>
        <button
          onClick={handleConfigClick}
          className="ml-2 p-1 text-green-600 hover:text-green-800 hover:bg-green-200 rounded transition-colors"
          title="配置参数"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
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