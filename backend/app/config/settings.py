import os
from typing import List
from dotenv import load_dotenv

# 加载.env文件
load_dotenv()

class Settings:
    # 数据库配置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./workflow.db")
    
    # 服务器配置
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # 外部服务配置
    EXTERNAL_AGENT_URL: str = os.getenv("EXTERNAL_AGENT_URL", "http://localhost:8080")
    
    # CORS配置
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3001,http://0.0.0.0:3001"
    ).split(",")
    
    # 外部Agent API端点
    @property
    def external_agent_api_url(self) -> str:
        return f"{self.EXTERNAL_AGENT_URL}/api/chatbycard"
    
    @property
    def external_agents_list_url(self) -> str:
        return f"{self.external_agent_api_url}/agents"
    
    @property
    def external_agent_chat_url(self) -> str:
        return f"{self.external_agent_api_url}/chat/completions"

# 创建全局设置实例
settings = Settings() 