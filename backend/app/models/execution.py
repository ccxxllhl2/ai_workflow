from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database.database import Base

class ExecutionStatus(str, enum.Enum):
    """执行状态枚举 - 继承str确保与SQLAlchemy兼容"""
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    
    @classmethod
    def _missing_(cls, value):
        """处理未知枚举值，提供向后兼容性"""
        if isinstance(value, str):
            # 尝试大写版本
            for member in cls:
                if member.value.lower() == value.lower():
                    return member
        return cls.PENDING  # 默认返回PENDING

class Execution(Base):
    __tablename__ = "executions"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    status = Column(Enum(ExecutionStatus, values_callable=lambda x: [e.value for e in x]), 
                   default=ExecutionStatus.PENDING)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    current_node = Column(String(255), nullable=True)  # 当前执行的节点ID
    variables = Column(Text, nullable=True)  # JSON字符串，存储执行过程中的变量
    error_message = Column(Text, nullable=True)
    
    # 关联关系
    workflow = relationship("Workflow", back_populates="executions")
    variables_records = relationship("Variable", back_populates="execution", cascade="all, delete-orphan")
    history_records = relationship("ExecutionHistory", back_populates="execution", cascade="all, delete-orphan") 