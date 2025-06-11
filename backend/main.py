from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import logging
from app.database.database import engine, Base
from app.api import workflows, agents

# 导入所有模型以确保表被创建
from app.models.workflow import Workflow
from app.models.node import Node
from app.models.agent import Agent
from app.models.execution import Execution
from app.models.variable import Variable
from app.models.execution_history import ExecutionHistory

# 配置logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局变量存储外部Agent信息
EXTERNAL_AGENTS = []

async def fetch_external_agents():
    """获取外部Agent信息"""
    try:
        response = requests.get("http://localhost:8080/api/chatbycard/agents", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('data'):
                global EXTERNAL_AGENTS
                EXTERNAL_AGENTS = data['data']['data']
                logger.info(f"成功获取到 {len(EXTERNAL_AGENTS)} 个外部Agent")
                return True
            else:
                logger.error(f"外部Agent API返回错误: {data}")
                return False
        else:
            logger.error(f"获取外部Agent失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"获取外部Agent异常: {str(e)}")
        return False

def get_external_agents():
    """获取缓存的外部Agent信息"""
    return EXTERNAL_AGENTS

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
    allow_origins=["http://localhost:3001"],  # React开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 启动时获取外部Agent信息
@app.on_event("startup")
async def startup_event():
    # 尝试获取外部Agent信息，但不阻止应用启动
    success = await fetch_external_agents()
    if success:
        logger.info("外部Agent服务连接成功")
    else:
        logger.warning("外部Agent服务暂不可用，应用仍可正常运行")

# 注册路由
app.include_router(workflows.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])

@app.get("/api/external-agents")
async def get_external_agents_api():
    """获取外部Agent信息的API"""
    return {"agents": get_external_agents()}

@app.get("/")
async def root():
    return {"message": "AI Agent Workflow Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 