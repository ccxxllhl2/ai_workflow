import React from 'react';
import { Handle, Position } from 'reactflow';

interface ConfluenceNodeProps {
  data: {
    label: string;
    config: any;
  };
  selected?: boolean;
  id: string;
}

const ConfluenceNode: React.FC<ConfluenceNodeProps> = ({ data, selected, id }) => {
  const handleConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('nodeConfig', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-indigo-50 border-2 ${
      selected ? 'border-indigo-600' : 'border-indigo-300'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-indigo-500"
      />
      
      <div className="flex items-center justify-between">
        <div className="ml-2">
          <div className="text-lg font-bold text-indigo-800">{data.label}</div>
          <div className="text-sm text-indigo-600">Confluence Integration</div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Confluence Logo */}
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.87 19.492c.494 1.516 1.528 2.594 3.01 3.14.49.18.995.252 1.528.22 1.51-.09 2.84-.99 3.61-2.45l4.75-9.03c1.21-2.3 3.99-3.19 6.29-1.98 2.3 1.21 3.19 3.99 1.98 6.29l-1.65 3.14c-.15.29-.03.65.26.8.29.15.65.03.8-.26l1.65-3.14c1.8-3.42.37-7.71-3.05-9.51-3.42-1.8-7.71-.37-9.51 3.05L4.77 18.832c-.54 1.02-1.47 1.65-2.53 1.71-.36.02-.71-.03-1.07-.15-1.04-.38-1.78-1.14-2.15-2.2-.15-.42-.05-.87.32-1.02.37-.15.83-.03.98.35zm22.26-14.98c-.49-1.516-1.528-2.594-3.01-3.14-.49-.18-.995-.252-1.528-.22-1.51.09-2.84.99-3.61 2.45l-4.75 9.03c-1.21 2.3-3.99 3.19-6.29 1.98-2.3-1.21-3.19-3.99-1.98-6.29l1.65-3.14c.15-.29.03-.65-.26-.8-.29-.15-.65-.03-.8.26l-1.65 3.14c-1.8 3.42-.37 7.71 3.05 9.51 3.42 1.8 7.71.37 9.51-3.05L19.23 5.168c.54-1.02 1.47-1.65 2.53-1.71.36-.02.71.03 1.07.15 1.04.38 1.78 1.14 2.15 2.2.15.42.05.87-.32 1.02-.37.15-.83.03-.98-.35z"/>
            </svg>
          </div>
          <button
            onClick={handleConfigClick}
            className="ml-2 p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-200 rounded transition-colors"
            title="Configure Confluence"
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
        className="w-3 h-3 bg-indigo-500"
      />
    </div>
  );
};

export default ConfluenceNode; 