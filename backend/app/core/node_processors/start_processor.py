import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.core.node_processors.base_processor import BaseNodeProcessor
from app.core.variable_manager import VariableManager

class StartNodeProcessor(BaseNodeProcessor):
    """开始节点处理器"""
    
    async def process(
        self, 
        node: Dict[str, Any], 
        execution_id: int, 
        variable_manager: VariableManager,
        db: Session
    ) -> Dict[str, Any]:
        """处理开始节点"""
        try:
            # 获取节点配置
            node_config = node.get('data', {}).get('config', {})
            if isinstance(node_config, str):
                node_config = json.loads(node_config)
            
            # 获取初始变量配置 - 兼容前端的字段名
            initial_variables_str = node_config.get('initialVariables', '{}')
            if isinstance(initial_variables_str, str):
                try:
                    initial_variables = json.loads(initial_variables_str)
                except json.JSONDecodeError:
                    initial_variables = {}
            else:
                initial_variables = initial_variables_str or {}
            
            # 设置初始变量
            if initial_variables:
                for key, value in initial_variables.items():
                    await variable_manager.set_variable(
                        execution_id, 
                        key, 
                        value, 
                        variable_manager._infer_type(value),
                        node['id']
                    )
            
            return {
                'status': 'success',
                'next_node': None  # 由引擎根据边连接查找下一个节点
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': f"Start node processing error: {str(e)}"
            } 