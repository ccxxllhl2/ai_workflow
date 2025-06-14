from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# SQLite数据库文件路径
SQLALCHEMY_DATABASE_URL = "sqlite:///./workflow_platform.db"

# 创建数据库引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # SQLite需要这个参数
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基础模型类
Base = declarative_base()

# 依赖注入：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 