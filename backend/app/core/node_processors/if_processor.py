import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.core.node_processors.base_processor import BaseNodeProcessor
from app.core.variable_manager import VariableManager

class IfNodeProcessor(BaseNodeProcessor):
    """条件判断节点处理器"""
    
    async def process(
        self, 
        node: Dict[str, Any], 
        execution_id: int, 
        variable_manager: VariableManager,
        db: Session
    ) -> Dict[str, Any]:
        """处理条件判断节点"""
        try:
            # 获取节点配置 - 修复JSON解析问题
            node_config = node.get('data', {}).get('config', {})
            if isinstance(node_config, str):
                node_config = json.loads(node_config)
            
            # 获取条件表达式（新的简化配置方式）
            condition_expr = node_config.get('condition', '')
            if condition_expr:
                # 使用Jinja2模板渲染条件表达式
                try:
                    # 渲染条件表达式
                    rendered_condition = await variable_manager.render_template(execution_id, condition_expr)
                    
                    # 评估条件表达式
                    result = eval(rendered_condition)
                    
                    return {
                        'status': 'success',
                        'next_node': None,
                        'output_branch': 'true' if result else 'false'
                    }
                except Exception as e:
                    return {
                        'status': 'error',
                        'error': f'Condition evaluation error: {str(e)}'
                    }
            
            # 兼容旧的条件配置方式
            conditions = node_config.get('conditions', [])
            if not conditions:
                return {
                    'status': 'error',
                    'error': 'No conditions specified in if node configuration'
                }
            
            # 评估条件
            for condition in conditions:
                if await self._evaluate_condition(condition, execution_id, variable_manager):
                    # 条件满足，返回对应的输出分支
                    output_branch = condition.get('output_branch', 'true')
                    return {
                        'status': 'success',
                        'next_node': None,  # 由引擎根据边连接和分支查找下一个节点
                        'output_branch': output_branch
                    }
            
            # 所有条件都不满足，走默认分支
            return {
                'status': 'success',
                'next_node': None,
                'output_branch': 'false'
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': f"If node processing error: {str(e)}"
            }
    
    async def _evaluate_condition(
        self, 
        condition: Dict[str, Any], 
        execution_id: int, 
        variable_manager: VariableManager
    ) -> bool:
        """评估单个条件"""
        try:
            variable_name = condition.get('variable')
            operator = condition.get('operator')
            expected_value = condition.get('value')
            
            if not all([variable_name, operator]):
                return False
            
            # 获取变量值
            actual_value = await variable_manager.get_variable(execution_id, variable_name)
            if actual_value is None:
                return False
            
            # 根据操作符进行比较
            if operator == '==':
                return actual_value == expected_value
            elif operator == '!=':
                return actual_value != expected_value
            elif operator == '>':
                return float(actual_value) > float(expected_value)
            elif operator == '<':
                return float(actual_value) < float(expected_value)
            elif operator == '>=':
                return float(actual_value) >= float(expected_value)
            elif operator == '<=':
                return float(actual_value) <= float(expected_value)
            elif operator == 'contains':
                return str(expected_value) in str(actual_value)
            elif operator == 'not_contains':
                return str(expected_value) not in str(actual_value)
            else:
                return False
                
        except Exception:
            return False 