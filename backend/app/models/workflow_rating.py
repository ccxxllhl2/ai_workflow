from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base

class WorkflowRating(Base):
    __tablename__ = "workflow_ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    is_liked = Column(Boolean, nullable=True)  # True=like, False=dislike, None=no rating
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    user = relationship("User", back_populates="ratings")
    workflow = relationship("Workflow", back_populates="ratings")
    
    # 确保每个用户对每个工作流只能有一个评价
    __table_args__ = (
        {'sqlite_autoincrement': True},
    ) 