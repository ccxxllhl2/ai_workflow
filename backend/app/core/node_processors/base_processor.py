from abc import ABC, abstractmethod
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.core.variable_manager import VariableManager

class BaseNodeProcessor(ABC):
    """节点处理器基类"""
    
    @abstractmethod
    async def process(
        self, 
        node: Dict[str, Any], 
        execution_id: int, 
        variable_manager: VariableManager,
        db: Session
    ) -> Dict[str, Any]:
        """
        处理节点逻辑
        
        Args:
            node: 节点配置
            execution_id: 执行ID
            variable_manager: 变量管理器
            db: 数据库会话
            
        Returns:
            Dict包含处理结果:
            - status: 'success', 'paused', 'completed', 'error'
            - next_node: 下一个节点ID (可选)
            - error: 错误信息 (当status为error时)
            - variables: 新创建的变量 (可选)
        """
        pass
    
    def _find_next_node(self, workflow_config: Dict[str, Any], current_node_id: str, output_key: str = None) -> str:
        """查找下一个节点ID"""
        edges = workflow_config.get('edges', [])
        for edge in edges:
            if edge.get('source') == current_node_id:
                # 如果指定了输出键，检查边的标签
                if output_key and edge.get('sourceHandle') != output_key:
                    continue
                return edge.get('target')
        return None 