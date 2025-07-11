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
            else:
                # 如果没有配置输出模板，生成默认的总结输出
                all_variables = await variable_manager.get_all_variables(execution_id)
                
                # 创建默认输出，包含所有变量信息
                default_output_parts = ["# 工作流执行完成\n"]
                
                if all_variables:
                    default_output_parts.append("## 执行结果\n")
                    for var_name, var_value in all_variables.items():
                        if var_name != 'final_output':  # 避免递归
                            # 如果是字符串且看起来像markdown，直接显示
                            if isinstance(var_value, str) and any(marker in var_value for marker in ['#', '**', '*', '`', '-']):
                                default_output_parts.append(f"### {var_name}\n{var_value}\n")
                            else:
                                # 否则格式化显示
                                default_output_parts.append(f"### {var_name}\n```\n{var_value}\n```\n")
                else:
                    default_output_parts.append("工作流执行完成，但没有可用的输出变量。")
                
                rendered_output = '\n'.join(default_output_parts)
            
            # 始终保存最终输出
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
                'output': rendered_output,
                'final_output': rendered_output
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': f"End node processing error: {str(e)}"
            } 