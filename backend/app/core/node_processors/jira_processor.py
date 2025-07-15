import json
import aiohttp
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.core.node_processors.base_processor import BaseNodeProcessor
from app.core.variable_manager import VariableManager
from app.models.meta import Meta

class JiraProcessor(BaseNodeProcessor):
    """Jira节点处理器 - 调用外部Jira API获取Epic信息"""
    
    def __init__(self, db: Session, variable_manager: VariableManager):
        super().__init__(db, variable_manager)
    
    async def process(self, node_id: str, config: Dict[str, Any], execution_id: int) -> Dict[str, Any]:
        """
        处理Jira节点
        
        Args:
            node_id: 节点ID
            config: 节点配置，包含jiraSource和jiraKeys
            execution_id: 执行ID
            
        Returns:
            包含处理结果的字典
        """
        try:
            # 获取配置参数
            jira_source = config.get('jiraSource', 'wpb').lower()
            jira_keys_str = config.get('jiraKeys', '')
            
            if not jira_keys_str.strip():
                return {
                    'success': False,
                    'error': 'Epic Key列表不能为空'
                }
            
            # 解析Epic Keys
            jira_keys = [key.strip() for key in jira_keys_str.split(',') if key.strip()]
            
            if not jira_keys:
                return {
                    'success': False,
                    'error': 'Epic Key列表格式错误'
                }
            
            # 获取Jira Token
            jira_token = self._get_jira_token()
            if not jira_token:
                return {
                    'success': False,
                    'error': '未配置Jira API Key，请在全局设置中配置'
                }
            
            # 调用外部Jira API
            result = await self._call_jira_api(jira_keys, jira_source, jira_token)
            
            if result['success']:
                # 将结果保存到变量中
                output_variable = config.get('outputVariable', 'jira_output')
                self.variable_manager.set_variable(
                    execution_id=execution_id,
                    name=output_variable,
                    value=result['data'],
                    var_type='string',
                    created_by_node=node_id
                )
                
                return {
                    'success': True,
                    'output': f'成功获取了{len(jira_keys)}个Epic的信息',
                    'data': result['data']
                }
            else:
                return {
                    'success': False,
                    'error': result['error']
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Jira节点处理失败: {str(e)}'
            }
    
    def _get_jira_token(self) -> str:
        """从数据库获取Jira Token"""
        try:
            meta = self.db.query(Meta).filter(Meta.key == 'jira_token').first()
            return meta.value if meta else ''
        except Exception:
            return ''
    
    async def _call_jira_api(self, jira_keys: List[str], jira_source: str, jira_token: str) -> Dict[str, Any]:
        """
        调用外部Jira API
        
        Args:
            jira_keys: Epic Key列表
            jira_source: Jira源（wpb或alm）
            jira_token: Jira API Token
            
        Returns:
            API调用结果
        """
        try:
            url = "http://8.138.11.1/jira/markdown"
            
            payload = {
                "jiraKeys": jira_keys,
                "jiraSource": jira_source,
                "jiraToken": jira_token
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json=payload,
                    headers={'Content-Type': 'application/json'},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.text()
                        return {
                            'success': True,
                            'data': data
                        }
                    else:
                        error_text = await response.text()
                        return {
                            'success': False,
                            'error': f'Jira API调用失败 (状态码: {response.status}): {error_text}'
                        }
                        
        except aiohttp.ClientError as e:
            return {
                'success': False,
                'error': f'网络请求失败: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'调用Jira API时发生错误: {str(e)}'
            } 