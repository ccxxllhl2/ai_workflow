from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.database.database import Base

class VariableType(str, enum.Enum):
    """变量类型枚举 - 继承str确保与SQLAlchemy兼容"""
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    JSON = "json"
    
    @classmethod
    def _missing_(cls, value):
        """处理未知枚举值，提供向后兼容性"""
        if isinstance(value, str):
            # 尝试大写版本
            for member in cls:
                if member.value.lower() == value.lower():
                    return member
        return cls.STRING  # 默认返回STRING

class Variable(Base):
    __tablename__ = "variables"
    
    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("executions.id"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    value = Column(Text, nullable=False)  # 存储变量值，复杂类型用JSON字符串
    type = Column(Enum(VariableType, values_callable=lambda x: [e.value for e in x]), 
                 nullable=False)
    created_by_node = Column(String(255), nullable=False)  # 创建该变量的节点ID
    
    # 关联关系
    execution = relationship("Execution", back_populates="variables_records") 