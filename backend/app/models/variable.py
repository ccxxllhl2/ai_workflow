from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.database.database import Base

class VariableType(enum.Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    JSON = "json"

class Variable(Base):
    __tablename__ = "variables"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    value = Column(Text, nullable=False)  # 存储变量值，复杂类型用JSON字符串
    type = Column(Enum(VariableType), nullable=False)
    created_by_node = Column(String(255), nullable=False)  # 创建该变量的节点ID
    
    # 关联关系
    execution = relationship("Execution", back_populates="variables_records") 