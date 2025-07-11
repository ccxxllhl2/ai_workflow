import json
import asyncio
import os
import aiohttp
from pathlib import Path
from typing import Dict, Any
from sqlalchemy.orm import Session
from openai import AsyncOpenAI
from dotenv import load_dotenv
from app.core.node_processors.base_processor import BaseNodeProcessor
from app.core.variable_manager import VariableManager
from app.models.agent import Agent

# 加载根目录的.env文件
# 获取当前文件的路径，然后向上找到项目根目录
current_file = Path(__file__)
project_root = current_file.parent.parent.parent.parent.parent  # backend/app/core/node_processors/ -> ai_workflow根目录
env_path = project_root / '.env'

# 检查.env文件是否存在并加载
if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ 成功加载环境变量文件: {env_path}")
else:
    print(f"⚠️  环境变量文件不存在: {env_path}")
    # 尝试从默认位置加载
    load_dotenv()

class AgentNodeProcessor(BaseNodeProcessor):
    """Agent节点处理器"""
    
    async def process(
        self, 
        node: Dict[str, Any], 
        execution_id: int, 
        variable_manager: VariableManager,
        db: Session
    ) -> Dict[str, Any]:
        """处理Agent节点"""
        try:
            # 获取节点配置
            node_config = node.get('data', {}).get('config', {})
            if isinstance(node_config, str):
                node_config = json.loads(node_config)
            
            # 检查是否直接配置了模型类型（新的配置方式）
            model_type = node_config.get('modelType')
            prompt_template = node_config.get('prompt', '')
            if not prompt_template:
                return {
                    'status': 'error',
                    'error': 'No prompt specified in node configuration'
                }
            
            # 使用Jinja2渲染提示词
            rendered_prompt = await variable_manager.render_template(execution_id, prompt_template)
            
            if model_type == 'qwen':
                # 调用千问API
                response = await self._call_qwen_api(rendered_prompt, node_config.get('modelName', 'qwen-turbo'))
            elif model_type == 'openai':
                # 调用OpenAI API
                response = await self._call_openai_api(rendered_prompt, node_config.get('modelName', 'gpt-3.5-turbo'))
            else:
                return {
                    'status': 'error',
                    'error': f'Unsupported model type: {model_type}'
                }
            
            # 保存响应为变量
            output_variable = node_config.get('outputVariable', f"{node['id']}_output")
            await variable_manager.set_variable(
                execution_id, 
                output_variable, 
                response, 
                variable_manager._infer_type(response),
                node['id']
            )
            
            return {
                'status': 'success',
                'next_node': None,  # 由引擎根据边连接查找下一个节点
                'prompt': rendered_prompt,
                'response': response,
                'output': f"Agent executed successfully. Output saved to variable '{output_variable}'"
            }
            
            # 兼容旧的Agent配置方式
            agent_id = node_config.get('agent_id')
            if not agent_id:
                return {
                    'status': 'error',
                    'error': 'No agent specified in node configuration'
                }
            
            # 获取Agent配置
            agent = db.query(Agent).filter(Agent.id == agent_id).first()
            if not agent:
                return {
                    'status': 'error',
                    'error': f'Agent {agent_id} not found'
                }
            
            # 获取对话内容模板
            prompt_template = node_config.get('prompt', '')
            if not prompt_template:
                return {
                    'status': 'error',
                    'error': 'No prompt specified in node configuration'
                }
            
            # 使用Jinja2渲染提示词
            rendered_prompt = await variable_manager.render_template(execution_id, prompt_template)
            
            # 调用LLM
            response = await self._call_llm(agent, rendered_prompt)
            
            # 保存响应为变量
            output_variable = node_config.get('output_variable', f"{node['id']}_output")
            await variable_manager.set_variable(
                execution_id, 
                output_variable, 
                response, 
                variable_manager._infer_type(response),
                node['id']
            )
            
            return {
                'status': 'success',
                'next_node': None,  # 由引擎根据边连接查找下一个节点
                'prompt': rendered_prompt,
                'response': response,
                'output': f"Agent executed successfully. Output saved to variable '{output_variable}'"
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': f"Agent node processing error: {str(e)}"
            }
    
    async def _call_qwen_api(self, prompt: str, model_name: str = 'qwen-turbo') -> str:
        """调用千问API"""
        try:
            # 从环境变量获取Token
            # qwen_token = os.getenv('QwenToken')
            qwen_token = "sk-6675f39e30ba44dcabbc605e0e9820c2"
            if not qwen_token:
                available_env_vars = [key for key in os.environ.keys() if 'qwen' in key.lower()]
                return f"[错误] 未配置QwenToken环境变量。当前环境中的相关变量: {available_env_vars}"
            
            # 千问API配置
            base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
            headers = {
                "Authorization": f"Bearer {qwen_token}",
                "Content-Type": "application/json"
            }
            
            # 构建请求数据
            data = {
                "model": model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 2000
            }
            
            # 发送请求
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result['choices'][0]['message']['content']
                    else:
                        error_text = await response.text()
                        return f"[千问API错误] HTTP {response.status}: {error_text}"
                        
        except Exception as e:
            return f"[千问API调用失败] {str(e)}"
    
    async def _call_openai_api(self, prompt: str, model_name: str = 'gpt-3.5-turbo') -> str:
        """调用OpenAI API"""
        try:
            # 从环境变量获取API Key
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if not openai_api_key:
                available_env_vars = [key for key in os.environ.keys() if 'openai' in key.lower()]
                return f"[错误] 未配置OPENAI_API_KEY环境变量。当前环境中的相关变量: {available_env_vars}"
            
            # 创建OpenAI客户端
            client = AsyncOpenAI(api_key=openai_api_key)
            
            # 调用OpenAI API
            response = await client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000,
                timeout=30.0
            )
            
            return response.choices[0].message.content or "[OpenAI返回空响应]"
            
        except Exception as e:
            return f"[OpenAI API调用失败] {str(e)}"
    
    async def _call_llm(self, agent: Agent, prompt: str) -> str:
        """调用LLM (兼容旧的Agent配置)"""
        # 检查是否是千问模型
        if agent.model.startswith('qwen'):
            return await self._call_qwen_api(prompt, agent.model)
        
        # 其他模型的模拟实现
        agent_config = json.loads(agent.config)
        
        # 模拟延迟
        await asyncio.sleep(1)
        
        # 模拟响应
        return f"[模拟{agent.model}响应] 收到提示: {prompt[:100]}..." 