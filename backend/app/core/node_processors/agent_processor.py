import json
import requests
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from .base_processor import BaseNodeProcessor
from app.core.variable_manager import VariableManager
from app.config.settings import settings

logger = logging.getLogger(__name__)

class AgentNodeProcessor(BaseNodeProcessor):
    async def process(
        self, 
        node: Dict[str, Any], 
        execution_id: int, 
        variable_manager: VariableManager,
        db: Session
    ) -> Dict[str, Any]:
        """处理Agent节点"""
        try:
            config = node.get('data', {}).get('config', {})
            agent_id = config.get('agentId')
            prompt_template = config.get('prompt', '')
            
            if not agent_id:
                return {
                    'status': 'error',
                    'error': 'Agent节点未配置Agent ID'
                }
            
            # 获取输入数据（从上一个节点传递过来）
            input_data = await variable_manager.get_variable(execution_id, 'current_input')
            if input_data is None:
                input_data = ""
            
            # 处理提示词模板（如果有的话）
            user_input = str(input_data)
            if prompt_template:
                try:
                    # 使用Jinja2模板渲染，包含所有执行变量
                    rendered_prompt = await variable_manager.render_template(execution_id, prompt_template)
                    user_input = rendered_prompt
                except Exception as template_error:
                    logger.warning(f"模板渲染失败: {str(template_error)}，使用原始模板和输入数据")
                    # 如果模板渲染失败，回退到简单的字符串替换
                    if '{{input}}' in prompt_template:
                        user_input = prompt_template.replace('{{input}}', str(input_data))
                    else:
                        user_input = f"{prompt_template}\n{input_data}"
            
            # 调用外部Agent API
            try:
                response = requests.post(
                    settings.external_agent_chat_url,
                    json={
                        "agentId": agent_id,
                        "userInput": user_input
                    },
                    timeout=30
                )
                
                if response.status_code == 200:
                    result_data = response.json()
                    
                    if result_data.get('code') == 200:
                        # 提取AI回复内容
                        ai_content = result_data.get('data', {}).get('content', '')
                        
                        # 设置当前输出为下一个节点的输入
                        from app.models.variable import VariableType
                        await variable_manager.set_variable(
                            execution_id, 
                            'current_input', 
                            ai_content, 
                            VariableType.STRING,
                            node['id']
                        )
                        
                        logger.info(f"Agent节点 {node['id']} 执行成功，输出长度: {len(ai_content)}")
                        
                        return {
                            'status': 'success',
                            'output': f'Agent {agent_id} 处理完成',
                            'prompt': user_input,
                            'response': ai_content
                        }
                    else:
                        # Agent API返回错误，输出空字符串
                        await variable_manager.set_variable(
                            execution_id, 
                            'current_input', 
                            '', 
                            VariableType.STRING,
                            node['id']
                        )
                        
                        logger.warning(f"Agent API返回错误码: {result_data.get('code')}")
                        
                        return {
                            'status': 'success',
                            'output': f'Agent API返回错误，输出空字符串',
                            'prompt': user_input,
                            'response': ''
                        }
                else:
                    # HTTP请求失败，输出空字符串
                    await variable_manager.set_variable(
                        execution_id, 
                        'current_input', 
                        '', 
                        VariableType.STRING,
                        node['id']
                    )
                    
                    logger.error(f"Agent API HTTP请求失败: {response.status_code}")
                    
                    return {
                        'status': 'success',
                        'output': f'Agent API请求失败，输出空字符串',
                        'prompt': user_input,
                        'response': ''
                    }
                    
            except Exception as api_error:
                # API调用异常，输出空字符串
                await variable_manager.set_variable(
                    execution_id, 
                    'current_input', 
                    '', 
                    VariableType.STRING,
                    node['id']
                )
                
                logger.error(f"Agent API调用异常: {str(api_error)}")
                
                return {
                    'status': 'success',
                    'output': f'Agent API调用异常，输出空字符串: {str(api_error)}',
                    'prompt': user_input,
                    'response': ''
                }
            
        except Exception as e:
            logger.error(f"Agent节点处理异常: {str(e)}")
            return {
                'status': 'error',
                'error': f'Agent节点处理异常: {str(e)}'
            } 