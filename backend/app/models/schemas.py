from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# 枚举类型
class WorkflowStatusEnum(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class NodeTypeEnum(str, Enum):
    START = "start"
    AGENT = "agent"
    IF = "if"
    HUMAN_CONTROL = "human_control"
    END = "end"

class ExecutionStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

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

# 执行相关模式
class ExecutionCreate(BaseModel):
    workflow_id: int

class ExecutionResponse(BaseModel):
    id: int
    workflow_id: int
    status: ExecutionStatusEnum
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_node: Optional[str] = None
    variables: Optional[str] = None
    error_message: Optional[str] = None
    
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

# 工作流执行请求
class WorkflowExecuteRequest(BaseModel):
    variables: Optional[Dict[str, Any]] = None

# 继续执行请求
class ContinueExecutionRequest(BaseModel):
    variables: Optional[Dict[str, Any]] = None

# 用户相关模式
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# 评价相关模式
class WorkflowRatingCreate(BaseModel):
    workflow_id: int
    is_liked: Optional[bool] = None  # True=like, False=dislike, None=remove rating

class WorkflowRatingResponse(BaseModel):
    id: int
    user_id: int
    workflow_id: int
    is_liked: Optional[bool]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# 带评价信息的工作流响应
class WorkflowWithRatingResponse(WorkflowResponse):
    user_rating: Optional[bool] = None  # 当前用户的评价
    like_count: int = 0  # 总点赞数
    dislike_count: int = 0  # 总点踩数

# 工作流导出和导入相关模式
class WorkflowExportData(BaseModel):
    """工作流导出数据格式"""
    name: str
    description: Optional[str] = None
    status: WorkflowStatusEnum
    config: Dict[str, Any]  # 解析后的JSON配置
    version: str = "1.0"  # 导出格式版本
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