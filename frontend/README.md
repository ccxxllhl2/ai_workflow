# AI Workflow Platform - Frontend

这是一个基于React和TypeScript构建的AI工作流平台前端应用。

## 主要功能

### 工作流管理
- 创建、编辑和管理AI工作流
- 可视化工作流编辑器，基于ReactFlow
- 支持多种节点类型：Agent、If、Start、End、Human Control等

### 执行管理
- **新功能**: 竖向Node执行状态列表
- 实时显示工作流执行状态
- 支持暂停和继续执行
- 人工干预和反馈支持
- 详细的执行历史记录

### 新增功能：Node执行状态显示

#### 功能特点
1. **自动页面切换**: 点击"Execute Workflow"按钮后自动切换到Execution Manager页面
2. **竖向Node列表**: 左侧显示所有节点的执行状态
3. **实时状态更新**: 动态显示当前执行到哪个Node
4. **美观动画效果**: 
   - 当前执行的Node有脉冲动画和高亮显示
   - 完成的Node显示绿色勾号
   - 失败的Node显示红色叉号
   - 暂停的Node显示橙色暂停图标
5. **连接线指示**: Node之间的连接线会根据执行状态变色

#### 视觉设计
- **等待状态**: 灰色圆点
- **执行中**: 蓝色脉冲动画圆点
- **已完成**: 绿色勾号
- **失败**: 红色叉号  
- **暂停**: 橙色暂停图标
- **当前节点**: 高亮背景 + 边框 + 放大效果

## 如何测试新功能

### 1. 启动项目
```bash
cd frontend
npm install
npm start
```

### 2. 测试自动页面切换
1. 登录系统
2. 选择或创建一个工作流
3. 在工作流编辑器中点击"Execute Workflow"按钮
4. **预期结果**: 应该自动切换到Execution Manager页面

### 3. 测试Node执行状态列表
1. 在Execution Manager页面，观察左侧的"Node Execution Status"面板
2. **预期结果**: 
   - 显示竖向的Node列表
   - 当前执行的Node有蓝色脉冲动画
   - Node之间有连接线
   - 状态会实时更新

### 4. 测试动画效果
1. 创建一个包含多个Node的工作流
2. 执行工作流
3. **预期结果**:
   - 当前执行的Node会高亮显示
   - 完成的Node显示绿色状态
   - 如果有暂停的Node，会显示橙色状态
   - Node切换时有平滑的动画过渡

### 5. 测试人工干预功能
1. 创建包含"Human Control"节点的工作流
2. 执行工作流直到暂停
3. **预期结果**:
   - Node列表中Human Control节点显示橙色暂停状态
   - 显示"Waiting for input..."提示
   - 可以通过Human Feedback功能继续执行

## 技术实现

### 新增组件
- `NodeExecutionList.tsx`: 竖向Node执行状态列表组件
- 集成到`ExecutionView.tsx`中

### 主要特性
- 实时轮询执行状态 (1秒间隔)
- 状态变化动画
- 响应式设计
- TypeScript类型安全

### 状态管理
- 使用React Hooks管理本地状态
- 通过API轮询获取实时数据
- 自动更新执行历史记录

## 依赖库

- React 19.1.0
- TypeScript 5.3.3
- ReactFlow 11.11.4 (用于工作流可视化)
- Tailwind CSS 3.4.1 (用于样式)
- Axios 1.6.7 (用于API调用)

## 最新修复和优化

### 🐛 已修复的问题

1. **移除旧的Node动画效果**
   - 删除了WorkflowEditor中的旧Node高亮动画
   - 现在所有执行状态显示都统一在NodeExecutionList组件中

2. **修复页面抖动问题**
   - 优化了执行历史的更新逻辑，防止频繁重新渲染
   - 添加了防抖机制，避免2秒内重复更新
   - 修复了多个human control节点导致的页面上下抖动
   - 改进了轮询管理，防止重复轮询实例

### 🚀 性能优化

- **智能更新策略**：只在必要时更新执行历史（完成、失败、暂停状态变化）
- **防抖机制**：2秒内避免重复的历史更新请求
- **轮询管理**：防止同一执行的多个轮询实例同时运行
- **状态管理优化**：减少不必要的组件重新渲染

## 项目结构

```
src/
  components/
    ExecutionView/
      ExecutionView.tsx       # 执行管理主页面（已优化）
      NodeExecutionList.tsx   # 新增：Node执行状态列表
      HumanFeedback.tsx      # 人工反馈组件
    WorkflowEditor.tsx       # 工作流编辑器（已移除旧动画）
    WorkflowManager/         # 工作流管理
    ...
  services/
    api.ts                   # API服务
  types/
    workflow.ts              # 类型定义
```

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
