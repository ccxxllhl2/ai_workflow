from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.database.database import Base

class NodeType(enum.Enum):
    START = "start"
    AGENT = "agent"
    IF = "if"
    END = "end"
    JIRA = "jira"
    CONFLUENCE = "confluence"

class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    node_id = Column(String(255), nullable=False)  # React Flow节点ID
    type = Column(Enum(NodeType), nullable=False)
    config = Column(Text, nullable=False)  # JSON字符串，存储节点配置
    position_x = Column(Float, nullable=False, default=0.0)
    position_y = Column(Float, nullable=False, default=0.0)
    
    # 关联关系
    workflow = relationship("Workflow", back_populates="nodes") 