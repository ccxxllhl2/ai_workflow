from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database.database import Base

class ExecutionHistoryStatus(enum.Enum):
    STARTED = "started"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"

class ExecutionHistory(Base):
    __tablename__ = "execution_history"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False)
    node_id = Column(String(255), nullable=False)  # 节点ID
    node_type = Column(String(50), nullable=False)  # 节点类型
    node_name = Column(String(255), nullable=True)  # 节点名称/标题
    status = Column(Enum(ExecutionHistoryStatus), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration = Column(Float, nullable=True)  # 执行持续时间（秒）
    output = Column(Text, nullable=True)  # 节点输出内容
    error_message = Column(Text, nullable=True)  # 错误信息
    variables_snapshot = Column(Text, nullable=True)  # 当时的变量快照（JSON格式）
    agent_prompt = Column(Text, nullable=True)  # AI Agent的提示词
    agent_response = Column(Text, nullable=True)  # AI Agent的响应
    chat_history = Column(Text, nullable=True)  # Human Control的聊天历史（JSON格式）
    
    # 关联关系
    execution = relationship("Execution", back_populates="history_records")

# 聊天消息模型（用于存储Human Control节点的聊天记录）
class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False)
    node_id = Column(String(255), nullable=True)  # 关联的节点ID（可选）
    role = Column(String(20), nullable=False)  # 'user' 或 'assistant'
    content = Column(Text, nullable=False)  # 消息内容
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # 关联关系
    execution = relationship("Execution") 