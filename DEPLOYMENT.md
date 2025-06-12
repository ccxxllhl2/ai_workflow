# AI工作流平台部署指南

## 环境变量配置

### 前端环境变量

前端使用以下环境变量（在项目根目录创建 `.env` 文件）：

```bash
# API配置
REACT_APP_API_BASE_URL=http://your-backend-domain.com
REACT_APP_EXTERNAL_AGENT_URL=http://your-external-service-domain.com

# 本地开发
REACT_APP_HOST=0.0.0.0
REACT_APP_PORT=3001
```

### 后端环境变量

后端使用以下环境变量（在backend目录创建 `.env` 文件）：

```bash
# 数据库配置
DATABASE_URL=sqlite:///./workflow.db

# 服务端口配置
HOST=0.0.0.0
PORT=8000

# 外部服务配置
EXTERNAL_AGENT_URL=http://your-external-service-domain.com

# CORS配置 (允许的前端域名，多个用逗号分隔)
ALLOWED_ORIGINS=http://your-frontend-domain.com,https://your-frontend-domain.com
```

## 本地开发

### 1. 前端开发

```bash
cd frontend
cp env.example .env
# 编辑 .env 文件设置正确的后端地址
npm install
npm start
```

### 2. 后端开发

```bash
cd backend
cp env.example .env
# 编辑 .env 文件设置正确的外部服务地址
pip install -r requirements.txt
python main.py
```

## 生产环境部署

### 1. 前端部署

```bash
cd frontend
# 创建生产环境配置
echo "REACT_APP_API_BASE_URL=https://your-api-domain.com" > .env.production
echo "REACT_APP_EXTERNAL_AGENT_URL=https://your-external-service-domain.com" >> .env.production

# 构建
npm run build

# 部署build文件夹到web服务器
```

### 2. 后端部署

```bash
cd backend
# 创建生产环境配置
echo "DATABASE_URL=your-production-database-url" > .env
echo "HOST=0.0.0.0" >> .env
echo "PORT=8000" >> .env
echo "EXTERNAL_AGENT_URL=https://your-external-service-domain.com" >> .env
echo "ALLOWED_ORIGINS=https://your-frontend-domain.com" >> .env

# 安装依赖
pip install -r requirements.txt

# 启动服务（推荐使用gunicorn等WSGI服务器）
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 跨域问题解决

1. **后端CORS配置**：已在 `main.py` 中配置，通过 `ALLOWED_ORIGINS` 环境变量控制
2. **生产环境**：确保 `ALLOWED_ORIGINS` 包含前端的实际域名
3. **开发环境**：默认允许 `localhost:3001` 和 `0.0.0.0:3001`

## 注意事项

1. **生产环境不要使用localhost**：所有环境变量中的URL都应该使用实际的域名或IP地址
2. **HTTPS支持**：生产环境建议使用HTTPS，确保前后端都支持SSL
3. **外部服务**：确保外部Agent服务（端口8080）在生产环境中可访问
4. **数据库**：生产环境建议使用PostgreSQL或MySQL替代SQLite
5. **安全性**：生产环境中要设置适当的CORS策略，不要使用通配符

## 环境变量优先级

1. 系统环境变量（最高优先级）
2. `.env` 文件
3. 代码中的默认值（最低优先级）

## 验证部署

部署完成后，访问以下URL验证：

- 前端应用：`http://your-frontend-domain.com`
- 后端API：`http://your-backend-domain.com/api`
- 健康检查：`http://your-backend-domain.com/health` 