import json
import asyncio
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.execution import Execution, ExecutionStatus
from app.models.workflow import Workflow
from app.models.node import Node, NodeType
from app.models.variable import Variable, VariableType
from app.core.variable_manager import VariableManager
from app.core.node_processors.start_processor import StartNodeProcessor
from app.core.node_processors.agent_processor import AgentNodeProcessor
from app.core.node_processors.if_processor import IfNodeProcessor
from app.core.node_processors.human_control_processor import HumanControlNodeProcessor
from app.core.node_processors.end_processor import EndNodeProcessor
from datetime import datetime

class WorkflowEngine:
    def __init__(self, db: Session):
        self.db = db
        self.variable_manager = VariableManager(db)
        
        # 节点处理器映射
        self.processors = {
            NodeType.START: StartNodeProcessor(),
            NodeType.AGENT: AgentNodeProcessor(),
            NodeType.IF: IfNodeProcessor(),
            NodeType.HUMAN_CONTROL: HumanControlNodeProcessor(),
            NodeType.END: EndNodeProcessor()
        }
    
    async def execute_workflow(self, execution_id: int, initial_variables: Dict[str, Any] = None):
        """执行工作流"""
        try:
            execution = self.db.query(Execution).filter(Execution.id == execution_id).first()
            if not execution:
                raise Exception(f"Execution {execution_id} not found")
            
            # 更新执行状态
            execution.status = ExecutionStatus.RUNNING
            self.db.commit()
            
            # 获取工作流配置
            workflow = execution.workflow
            workflow_config = json.loads(workflow.config)
            
            # 初始化变量
            if initial_variables:
                await self.variable_manager.set_variables(execution_id, initial_variables, "start")
            
            # 找到开始节点
            start_node = self._find_start_node(workflow_config)
            if not start_node:
                raise Exception("No start node found in workflow")
            
            # 从开始节点执行
            await self._execute_from_node(execution_id, start_node, workflow_config)
            
        except Exception as e:
            # 更新执行状态为失败
            execution = self.db.query(Execution).filter(Execution.id == execution_id).first()
            if execution:
                execution.status = ExecutionStatus.FAILED
                execution.error_message = str(e)
                execution.completed_at = datetime.utcnow()
                self.db.commit()
            raise e
    
    async def continue_execution(self, execution_id: int, additional_variables: Dict[str, Any] = None):
        """继续暂停的工作流执行"""
        try:
            print(f"DEBUG: continue_execution called for execution {execution_id}")
            execution = self.db.query(Execution).filter(Execution.id == execution_id).first()
            if not execution:
                raise Exception(f"Execution {execution_id} not found")
            
            if execution.status != ExecutionStatus.PAUSED:
                raise Exception("Execution is not paused")
            
            print(f"DEBUG: Current node before continue: {execution.current_node}")
            
            # 更新执行状态
            execution.status = ExecutionStatus.RUNNING
            self.db.commit()
            
            # 添加新变量
            if additional_variables:
                await self.variable_manager.set_variables(execution_id, additional_variables, execution.current_node)
                print(f"DEBUG: Added variables: {additional_variables}")
            
            # 获取工作流配置
            workflow = execution.workflow
            workflow_config = json.loads(workflow.config)
            
            # 对于人工干预节点，直接找到下一个节点继续执行
            current_node = self._find_node_by_id(workflow_config, execution.current_node)
            print(f"DEBUG: Current node found: {current_node}")
            
            if current_node and current_node.get('type') == 'human_control':
                print("DEBUG: Processing human_control node")
                # 找到下一个节点
                next_node_id = self._find_next_node_id(workflow_config, execution.current_node)
                print(f"DEBUG: Next node ID: {next_node_id}")
                
                if next_node_id:
                    next_node = self._find_node_by_id(workflow_config, next_node_id)
                    print(f"DEBUG: Next node found: {next_node}")
                    
                    if next_node:
                        # 直接从下一个节点开始执行，不更新当前节点ID（因为_execute_from_node会处理）
                        print("DEBUG: Starting execution from next node")
                        await self._execute_from_node(execution_id, next_node, workflow_config)
                    else:
                        # 没有下一个节点，工作流结束
                        print("DEBUG: No next node found, completing workflow")
                        execution.status = ExecutionStatus.COMPLETED
                        execution.completed_at = datetime.utcnow()
                        self.db.commit()
                else:
                    # 没有下一个节点，工作流结束
                    print("DEBUG: No next node ID found, completing workflow")
                    execution.status = ExecutionStatus.COMPLETED
                    execution.completed_at = datetime.utcnow()
                    self.db.commit()
            else:
                # 其他类型的节点从当前节点继续执行
                print("DEBUG: Processing non-human_control node")
                await self._execute_from_node(execution_id, current_node, workflow_config)
            
        except Exception as e:
            print(f"DEBUG: Exception in continue_execution: {str(e)}")
            # 更新执行状态为失败
            execution = self.db.query(Execution).filter(Execution.id == execution_id).first()
            if execution:
                execution.status = ExecutionStatus.FAILED
                execution.error_message = str(e)
                execution.completed_at = datetime.utcnow()
                self.db.commit()
            raise e
    
    async def _execute_from_node(self, execution_id: int, node: Dict[str, Any], workflow_config: Dict[str, Any]):
        """从指定节点开始执行"""
        execution = self.db.query(Execution).filter(Execution.id == execution_id).first()
        
        while node and execution.status == ExecutionStatus.RUNNING:
            # 更新当前执行节点
            execution.current_node = node['id']
            self.db.commit()
            
            # 获取节点处理器
            node_type = NodeType(node['type'])
            processor = self.processors.get(node_type)
            
            if not processor:
                raise Exception(f"No processor found for node type: {node_type}")
            
            # 执行节点
            result = await processor.process(
                node, 
                execution_id, 
                self.variable_manager, 
                self.db
            )
            
            # 检查执行结果
            if result.get('status') == 'paused':
                # 节点要求暂停执行
                execution.status = ExecutionStatus.PAUSED
                self.db.commit()
                break
            elif result.get('status') == 'completed':
                # 工作流完成
                execution.status = ExecutionStatus.COMPLETED
                execution.completed_at = datetime.utcnow()
                self.db.commit()
                break
            elif result.get('status') == 'error':
                # 节点执行出错
                execution.status = ExecutionStatus.FAILED
                execution.error_message = result.get('error', 'Unknown error')
                execution.completed_at = datetime.utcnow()
                self.db.commit()
                break
            
            # 获取下一个节点
            next_node_id = result.get('next_node')
            if not next_node_id:
                # 如果节点处理器没有指定下一个节点，从工作流配置中查找
                output_branch = result.get('output_branch')
                next_node_id = self._find_next_node_id(workflow_config, node['id'], output_branch)
            
            if next_node_id:
                node = self._find_node_by_id(workflow_config, next_node_id)
            else:
                # 没有下一个节点，工作流结束
                execution.status = ExecutionStatus.COMPLETED
                execution.completed_at = datetime.utcnow()
                self.db.commit()
                break
            
            # 刷新执行状态
            self.db.refresh(execution)
    
    def _find_start_node(self, workflow_config: Dict[str, Any]) -> Dict[str, Any]:
        """查找开始节点"""
        nodes = workflow_config.get('nodes', [])
        for node in nodes:
            if node.get('type') == 'start':
                return node
        return None
    
    def _find_node_by_id(self, workflow_config: Dict[str, Any], node_id: str) -> Dict[str, Any]:
        """根据ID查找节点"""
        nodes = workflow_config.get('nodes', [])
        for node in nodes:
            if node.get('id') == node_id:
                return node
        return None
    
    def _find_next_node_id(self, workflow_config: Dict[str, Any], current_node_id: str, output_branch: str = None) -> str:
        """查找下一个节点ID"""
        edges = workflow_config.get('edges', [])
        for edge in edges:
            if edge.get('source') == current_node_id:
                # 如果指定了输出分支，检查边的标签
                if output_branch and edge.get('sourceHandle') != output_branch:
                    continue
                return edge.get('target')
        return None 