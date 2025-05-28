import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.core.node_processors.base_processor import BaseNodeProcessor
from app.core.variable_manager import VariableManager

class HumanControlNodeProcessor(BaseNodeProcessor):
    """人工干预节点处理器"""
    
    async def process(
        self, 
        node: Dict[str, Any], 
        execution_id: int, 
        variable_manager: VariableManager,
        db: Session
    ) -> Dict[str, Any]:
        """处理人工干预节点"""
        try:
            # 获取节点配置 - 修复JSON解析问题
            node_config = node.get('data', {}).get('config', {})
            if isinstance(node_config, str):
                node_config = json.loads(node_config)
            
            # 人工干预节点总是暂停工作流执行
            # 等待用户手动继续
            return {
                'status': 'paused',
                'message': 'Workflow paused for human intervention',
                'node_config': node_config
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': f"Human control node processing error: {str(e)}"
            } 