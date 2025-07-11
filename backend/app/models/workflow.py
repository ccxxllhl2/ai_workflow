from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database.database import Base

class WorkflowStatus(str, enum.Enum):
    """工作流状态枚举 - 继承str确保与SQLAlchemy兼容"""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    
    @classmethod
    def _missing_(cls, value):
        """处理未知枚举值，提供向后兼容性"""
        if isinstance(value, str):
            # 尝试大写版本
            for member in cls:
                if member.value.lower() == value.lower():
                    return member
        return cls.DRAFT  # 默认返回DRAFT

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    config = Column(Text, nullable=False)  # JSON字符串，存储节点和连接配置
    status = Column(Enum(WorkflowStatus, values_callable=lambda x: [e.value for e in x]), 
                   default=WorkflowStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    nodes = relationship("Node", back_populates="workflow", cascade="all, delete-orphan")
    executions = relationship("Execution", back_populates="workflow", cascade="all, delete-orphan") 