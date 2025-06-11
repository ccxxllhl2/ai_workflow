import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.core.node_processors.base_processor import BaseNodeProcessor
from app.core.variable_manager import VariableManager

class EndNodeProcessor(BaseNodeProcessor):
    """结束节点处理器"""
    
    async def process(
        self, 
        node: Dict[str, Any], 
        execution_id: int, 
        variable_manager: VariableManager,
        db: Session
    ) -> Dict[str, Any]:
        """处理结束节点 - 直接输出上一个节点的输入作为最终输出"""
        try:
            # 获取当前输入（上一个节点的输出）
            current_input = await variable_manager.get_variable(execution_id, 'current_input')
            
            # 将当前输入作为字符串格式的最终输出
            final_output = str(current_input) if current_input is not None else ""
            
            # 保存最终输出
            from app.models.variable import VariableType
            await variable_manager.set_variable(
                execution_id,
                'final_output',
                final_output,
                VariableType.STRING,
                node['id']
            )
            
            # 结束节点标记工作流完成
            return {
                'status': 'completed',
                'message': 'Workflow completed successfully',
                'final_output': final_output
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': f"End node processing error: {str(e)}"
            } 