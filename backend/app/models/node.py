from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.database.database import Base

class NodeType(str, enum.Enum):
    """节点类型枚举 - 继承str确保与SQLAlchemy兼容"""
    START = "start"
    AGENT = "agent"
    IF = "if"
    HUMAN_CONTROL = "human_control"
    END = "end"
    
    @classmethod
    def _missing_(cls, value):
        """处理未知枚举值，提供向后兼容性"""
        if isinstance(value, str):
            # 尝试大写版本
            for member in cls:
                if member.value.lower() == value.lower():
                    return member
        return cls.START  # 默认返回START

class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    node_id = Column(String(255), nullable=False)  # React Flow节点ID
    type = Column(Enum(NodeType, values_callable=lambda x: [e.value for e in x]), 
                 nullable=False)
    config = Column(Text, nullable=False)  # JSON字符串，存储节点配置
    position_x = Column(Float, nullable=False, default=0.0)
    position_y = Column(Float, nullable=False, default=0.0)
    
    # 关联关系
    workflow = relationship("Workflow", back_populates="nodes") 