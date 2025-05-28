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
        """处理结束节点"""
        try:
            # 获取节点配置 - 修复JSON解析问题
            node_config = node.get('data', {}).get('config', {})
            if isinstance(node_config, str):
                node_config = json.loads(node_config)
            
            # 获取输出文本模板
            output_template = node_config.get('output_text', '')
            rendered_output = None
            
            # 如果有输出模板，使用Jinja2渲染
            if output_template:
                rendered_output = await variable_manager.render_template(execution_id, output_template)
                
                # 保存最终输出
                await variable_manager.set_variable(
                    execution_id,
                    'final_output',
                    rendered_output,
                    variable_manager._infer_type(rendered_output),
                    node['id']
                )
            
            # 结束节点标记工作流完成
            return {
                'status': 'completed',
                'message': 'Workflow completed successfully',
                'final_output': rendered_output if output_template else None
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': f"End node processing error: {str(e)}"
            } 