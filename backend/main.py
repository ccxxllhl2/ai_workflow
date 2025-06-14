from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app.api import workflows, agents, execution, auth, ratings

# 导入所有模型以确保表被创建
from app.models.workflow import Workflow
from app.models.node import Node
from app.models.agent import Agent
from app.models.execution import Execution
from app.models.variable import Variable
from app.models.execution_history import ExecutionHistory, ChatMessage
from app.models.user import User
from app.models.workflow_rating import WorkflowRating

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Agent Workflow Platform",
    description="A visual workflow platform for AI agents",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(workflows.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(execution.router, prefix="/api/executions", tags=["executions"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["ratings"])

@app.get("/")
async def root():
    return {"message": "AI Agent Workflow Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 