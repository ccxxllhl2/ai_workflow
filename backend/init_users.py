#!/usr/bin/env python3
"""
初始化数据库用户数据
创建默认的测试用户：user1-user9，密码都是123456
"""

from app.database.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.workflow import Workflow
from app.models.node import Node
from app.models.workflow_rating import WorkflowRating
from app.models.execution import Execution
from app.models.variable import Variable
from app.models.execution_history import ExecutionHistory, ChatMessage
from app.models.agent import Agent

def init_users():
    """初始化默认用户"""
    db = SessionLocal()
    try:
        # 检查是否已经有用户
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Database already has {existing_users} users. Skipping initialization.")
            return
        
        # 创建默认用户 user1-user9
        default_users = []
        for i in range(1, 10):
            username = f"user{i}"
            user = User(
                username=username,
                password="123456"  # 在实际项目中应该加密
            )
            default_users.append(user)
        
        # 批量添加用户
        db.add_all(default_users)
        db.commit()
        
        print("Successfully created default users:")
        for user in default_users:
            print(f"  - {user.username} (password: 123456)")
        
    except Exception as e:
        print(f"Error initializing users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # 确保数据库表已创建
    Base.metadata.create_all(bind=engine)
    
    # 初始化用户
    init_users() 