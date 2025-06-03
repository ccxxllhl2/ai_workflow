from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # 在实际项目中应该加密
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关联关系
    ratings = relationship("WorkflowRating", back_populates="user", cascade="all, delete-orphan") 