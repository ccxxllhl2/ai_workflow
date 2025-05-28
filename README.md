# 🤖 AI工作流平台

一个基于React + FastAPI的可视化AI工作流设计与执行平台，支持拖拽式工作流编辑、AI智能体集成、人工干预节点等功能。

## ✨ 主要特性

- 🎨 **可视化编辑器**: 基于React Flow的拖拽式工作流设计
- 🤖 **AI智能体集成**: 支持千问等大模型API调用
- ⏸️ **人工干预支持**: 工作流暂停与人工反馈功能
- 🔄 **实时执行监控**: 工作流执行状态可视化
- 📊 **执行历史管理**: 完整的执行记录与结果查看
- 🔧 **变量管理**: 支持Jinja2模板渲染
- 🎯 **多节点类型**: 开始、智能体、条件判断、人工干预、结束节点

## 🏗️ 技术架构

### 后端
- **FastAPI**: 现代化Python Web框架
- **SQLAlchemy**: ORM数据库操作
- **SQLite**: 轻量级数据库
- **Jinja2**: 模板引擎
- **Pydantic**: 数据验证

### 前端
- **React 19**: 现代化前端框架
- **TypeScript**: 类型安全
- **React Flow**: 可视化工作流编辑
- **Tailwind CSS**: 现代化UI设计
- **Axios**: HTTP客户端

## 🚀 快速开始

### 环境要求

- Python 3.9+
- Node.js 18+
- npm 或 yarn

### 后端安装

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd ai_workflow
   ```

2. **安装Python依赖**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **配置环境变量**
   ```bash
   cp env.example .env
   # 编辑.env文件，配置千问API密钥等
   ```

4. **初始化数据库**
   ```bash
   # 数据库会在首次运行时自动创建
   ```

5. **启动后端服务**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### 前端安装

1. **安装Node.js依赖**
   ```bash
   cd frontend
   npm install
   ```

2. **启动前端服务**
   ```bash
   npm start
   ```

3. **访问应用**
   - 前端: http://localhost:3000
   - 后端API: http://localhost:8000
   - API文档: http://localhost:8000/docs

## 🔧 配置说明

### 环境变量

创建`backend/.env`文件并配置以下变量：

```env
# 千问API配置
QwenToken=your-qwen-api-token-here

# 数据库配置
DATABASE_URL=sqlite:///./app.db

# 应用配置
DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000

# CORS配置
CORS_ORIGINS=http://localhost:3000
```

### 千问API配置

1. 访问[阿里云DashScope](https://dashscope.aliyuncs.com/)
2. 获取API Token
3. 在`.env`文件中配置`QwenToken`

## 📖 使用指南

### 创建工作流

1. 点击"工作流管理"
2. 点击"创建新工作流"
3. 输入工作流名称和描述

### 设计工作流

1. 在编辑器中添加节点：
   - **开始节点**: 定义初始变量
   - **AI智能体**: 配置AI提示和输出
   - **条件判断**: 设置分支逻辑
   - **人工干预**: 暂停等待人工输入
   - **结束节点**: 定义最终输出

2. 连接节点创建工作流

3. 配置每个节点的参数

### 执行工作流

1. 点击"执行工作流"启动
2. 在"执行管理"中监控状态
3. 对于人工干预节点，点击"人工反馈"进行干预

## 🔄 节点类型说明

### 开始节点
- 定义工作流初始变量
- 支持JSON格式变量配置

### AI智能体节点
- 集成千问等大模型
- 支持Jinja2模板变量引用
- 可配置输出变量名

### 条件判断节点
- 基于表达式的条件分支
- 支持True/False两个输出端口
- 可使用变量进行条件判断

### 人工干预节点
- 暂停工作流执行
- 支持变量编辑
- 集成AI聊天助手

### 结束节点
- 定义工作流最终输出
- 支持Jinja2模板渲染

## 🛠️ 开发说明

### 项目结构

```
ai_workflow/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心逻辑
│   │   ├── models/         # 数据模型
│   │   └── main.py         # 应用入口
│   └── requirements.txt    # Python依赖
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── services/       # API服务
│   │   └── types/          # TypeScript类型
│   └── package.json        # Node.js依赖
└── README.md              # 项目说明
```

### API文档

启动后端服务后，访问 http://localhost:8000/docs 查看完整的API文档。

### 开发工具

```bash
# 后端代码检查
cd backend
python -m pytest

# 前端代码检查
cd frontend
npm run lint
npm run type-check
```

## 🔒 安全说明

- 所有API密钥通过环境变量配置
- 数据库文件自动忽略提交
- CORS严格配置仅允许特定来源
- 输入数据经过严格验证

## 📝 更新日志

### v1.0.0 (2024-12)
- ✅ 基础工作流编辑器
- ✅ 5种节点类型支持
- ✅ 千问AI集成
- ✅ 人工干预功能
- ✅ 执行状态监控
- ✅ 现代化UI设计

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 💬 支持

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送 Pull Request
- 邮件联系: [your-email@example.com]

---

**享受构建AI工作流的乐趣！** 🚀 