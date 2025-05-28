# 🤖 AI Workflow Platform

A visual AI workflow design and execution platform based on React + FastAPI, supporting drag-and-drop workflow editing, AI agent integration, human intervention nodes, and more.

## ✨ Key Features

- 🎨 **Visual Editor**: Drag-and-drop workflow design based on React Flow
- 🤖 **AI Agent Integration**: Support for large language models like Qwen API
- ⏸️ **Human Intervention Support**: Workflow pause and human feedback functionality
- 🔄 **Real-time Execution Monitoring**: Visual workflow execution status
- 📊 **Execution History Management**: Complete execution records and result viewing
- 🔧 **Variable Management**: Support for Jinja2 template rendering
- 🎯 **Multiple Node Types**: Start, Agent, Condition, Human Control, and End nodes

## 🏗️ Technical Architecture

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM database operations
- **SQLite**: Lightweight database
- **Jinja2**: Template engine
- **Pydantic**: Data validation

### Frontend
- **React 19**: Modern frontend framework
- **TypeScript**: Type safety
- **React Flow**: Visual workflow editing
- **Tailwind CSS**: Modern UI design
- **Axios**: HTTP client

## 🚀 Quick Start

### Requirements

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Clone the project**
   ```bash
   git clone <repository-url>
   cd ai_workflow
   ```

2. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env file and configure Qwen API key
   ```

4. **Initialize database**
   ```bash
   # Database will be created automatically on first run
   ```

5. **Start backend service**
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Install Node.js dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start frontend service**
   ```bash
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables

Create a `backend/.env` file and configure the following variables:

```env
# Qwen API Configuration
QwenToken=your-qwen-api-token-here
```

### Qwen API Setup

1. Visit [Alibaba Cloud DashScope](https://dashscope.aliyuncs.com/)
2. Get your API Token
3. Configure `QwenToken` in the `.env` file

## 📖 User Guide

### Creating Workflows

1. Click "Workflow Manager"
2. Click "Create New Workflow"
3. Enter workflow name and description

### Designing Workflows

1. Add nodes in the editor:
   - **Start Node**: Define initial variables
   - **AI Agent**: Configure AI prompts and outputs
   - **Condition Node**: Set branching logic
   - **Human Control**: Pause for human input
   - **End Node**: Define final output

2. Connect nodes to create workflow

3. Configure parameters for each node

### Executing Workflows

1. Click "Execute Workflow" to start
2. Monitor status in "Execution Manager"
3. For human control nodes, click "Human Feedback" to intervene

## 🔄 Node Types

### Start Node
- Define workflow initial variables
- Support JSON format variable configuration

### AI Agent Node
- Integrate large language models like Qwen
- Support Jinja2 template variable references
- Configurable output variable names

### Condition Node
- Expression-based conditional branching
- Support True/False output ports
- Use variables for condition evaluation

### Human Control Node
- Pause workflow execution
- Support variable editing
- Integrated AI chat assistant

### End Node
- Define workflow final output
- Support Jinja2 template rendering

## 🛠️ Development

### Project Structure

```
ai_workflow/
├── backend/                 # Backend code
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core logic
│   │   ├── models/         # Data models
│   │   └── main.py         # Application entry
│   └── requirements.txt    # Python dependencies
├── frontend/               # Frontend code
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── package.json        # Node.js dependencies
└── README.md              # Project documentation
```

### API Documentation

After starting the backend service, visit http://localhost:8000/docs to view the complete API documentation.

### Development Tools

```bash
# Backend testing
cd backend
python -m pytest

# Frontend testing
cd frontend
npm test

# Code formatting
npm run format
```

## 🎯 Use Cases

- **Business Process Automation**: Design complex business workflows with human approval steps
- **AI-Powered Decision Making**: Create workflows that combine AI analysis with human judgment
- **Data Processing Pipelines**: Build data transformation workflows with conditional logic
- **Customer Service Automation**: Implement chatbot workflows with escalation to human agents
- **Content Generation**: Create AI-assisted content workflows with human review

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) for the visual workflow editor
- [FastAPI](https://fastapi.tiangolo.com/) for the modern Python web framework
- [Alibaba Cloud DashScope](https://dashscope.aliyuncs.com/) for AI model integration
- [Tailwind CSS](https://tailwindcss.com/) for the beautiful UI design 