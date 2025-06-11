from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# 枚举类型
class WorkflowStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"

class NodeTypeEnum(str, Enum):
    START = "start"
    AGENT = "agent"
    IF = "if"
    END = "end"

class VariableTypeEnum(str, Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    JSON = "json"

# 工作流相关模式
class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    config: str  # JSON字符串

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[str] = None
    status: Optional[WorkflowStatusEnum] = None

class WorkflowResponse(WorkflowBase):
    id: int
    status: WorkflowStatusEnum
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class WorkflowWithArgsResponse(WorkflowResponse):
    """工作流响应，包含参数信息"""
    args: List[str] = []

class WorkflowWithDetailsResponse(WorkflowResponse):
    """工作流响应，包含节点和变量信息"""
    nodes: List[str] = []  # 按执行顺序的节点名称列表
    vars: Dict[str, str] = {}   # start节点的变量列表 {"var_name": "description"}

# 工作流执行请求
class WorkflowExecuteRequest(BaseModel):
    variables: Optional[Dict[str, Any]] = None

# 运行工作流请求
class RunWorkflowRequest(BaseModel):
    id: str  # 工作流ID
    args: Optional[Dict[str, Any]] = None  # 初始变量

# 运行工作流响应
class RunWorkflowResponse(BaseModel):
    code: int  # 状态码，200表示成功
    message: str  # 错误消息，成功时为空字符串
    data: str  # 最终输出结果

# 节点相关模式
class NodeBase(BaseModel):
    node_id: str
    type: NodeTypeEnum
    config: str  # JSON字符串
    position_x: float
    position_y: float

class NodeCreate(NodeBase):
    workflow_id: int

class NodeResponse(NodeBase):
    id: int
    workflow_id: int
    
    class Config:
        from_attributes = True

# Agent相关模式
class AgentBase(BaseModel):
    name: str
    model: str
    config: str  # JSON字符串

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    config: Optional[str] = None

class AgentResponse(AgentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# 变量相关模式
class VariableBase(BaseModel):
    name: str
    value: str
    type: VariableTypeEnum
    created_by_node: str

class VariableCreate(VariableBase):
    execution_id: int

class VariableResponse(VariableBase):
    id: int
    execution_id: int
    
    class Config:
        from_attributes = True

# 工作流导出和导入相关模式
class WorkflowExportData(BaseModel):
    """工作流导出数据格式"""
    name: str
    description: Optional[str] = None
    status: WorkflowStatusEnum
    config: Dict[str, Any]  # 解析后的JSON配置
    exported_at: datetime
    
class WorkflowImportRequest(BaseModel):
    """工作流导入请求"""
    name: Optional[str] = None  # 如果提供，将覆盖导入数据中的名称
    description: Optional[str] = None  # 如果提供，将覆盖导入数据中的描述
    workflow_data: WorkflowExportData
    
class WorkflowImportResponse(BaseModel):
    """工作流导入响应"""
    success: bool
    message: str
    workflow_id: Optional[int] = None
    workflow: Optional[WorkflowResponse] = None 