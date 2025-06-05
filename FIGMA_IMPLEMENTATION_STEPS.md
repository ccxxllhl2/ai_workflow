# Figma实施步骤详细指南

## 🚀 第一步：创建设计文件并设置基础

### 1.1 创建新的Figma文件
1. 打开Figma，点击"Create new design file"
2. 重命名文件为："AI Workflow Platform - Design System"
3. 设置画布为Desktop (1440px)

### 1.2 设置颜色样式
1. 在右侧Properties面板，点击"Local styles" → "+"
2. 按照以下颜色逐一创建颜色样式：

**主色调**
- `Primary/Blue` - #3B82F6
- `Primary/Purple` - #8B5CF6  
- `Primary/Pink` - #EC4899

**状态颜色**
- `Status/Success` - #10B981
- `Status/Success-Dark` - #059669
- `Status/Warning` - #F59E0B
- `Status/Warning-Dark` - #D97706
- `Status/Error` - #EF4444
- `Status/Error-Dark` - #DC2626

**中性色**
- `Neutral/Gray-900` - #111827
- `Neutral/Gray-700` - #374151
- `Neutral/Gray-500` - #6B7280
- `Neutral/Gray-400` - #9CA3AF
- `Neutral/Gray-200` - #E5E7EB
- `Neutral/White` - #FFFFFF

### 1.3 设置文字样式
1. 在Properties面板，选择Text styles → "+"
2. 创建以下文字样式：

**标题样式**
- `H1/Title` - 36px, Bold, Gray-900
- `H2/Section` - 24px, Bold, Gray-900
- `H3/Card Title` - 20px, Bold, Gray-900

**正文样式**  
- `Body/Large` - 18px, Regular, Gray-700
- `Body/Default` - 16px, Regular, Gray-700
- `Body/Small` - 14px, Regular, Gray-700
- `Caption` - 12px, Regular, Gray-500

**按钮样式**
- `Button/Text` - 14px, Medium, White

### 1.4 设置阴影效果
1. 选择Effect styles → "+"
2. 创建阴影效果：

**卡片阴影**
- `Shadow/Card` - Drop shadow: X:0, Y:25, Blur:50, Spread:-12, Color:#000000, Opacity:25%

**按钮悬停阴影**
- `Shadow/Button-Hover` - Drop shadow: X:0, Y:4, Blur:6, Spread:-1, Color:#000000, Opacity:10%

## 🧩 第二步：创建基础组件

### 2.1 创建按钮组件

**创建主要按钮 (Primary Button)**
1. 创建Rectangle (命名为"Primary Button")
2. 设置尺寸：Auto × 40px
3. 设置填充：Linear gradient (Success → Success-Dark, 135°)
4. 设置圆角：12px
5. 添加文字："Button Text"，应用Button/Text样式
6. 设置Auto Layout：
   - Direction: Horizontal
   - Padding: 12px vertical, 24px horizontal
   - Gap: 8px (用于图标+文字)
7. 创建Component (Ctrl/Cmd + Alt + K)
8. 创建Variants：
   - Default (正常状态)
   - Hover (添加Shadow/Button-Hover，Y:-2px transform)
   - Disabled (Opacity: 50%)

**创建次要按钮 (Secondary Button)**
- 复制Primary Button
- 修改填充：Linear gradient (Gray-500 → Gray-600, 135°)
- 重命名为"Secondary Button"

### 2.2 创建输入框组件

**创建基础输入框**
1. 创建Rectangle (命名为"Input Field")
2. 设置尺寸：320px × 40px
3. 设置填充：White
4. 设置边框：1px, Gray-200
5. 设置圆角：6px
6. 添加占位符文字："输入内容..."，应用Body/Small样式
7. 设置Auto Layout：
   - Padding: 8px vertical, 12px horizontal
8. 创建Component并添加Variants：
   - Default
   - Focus (边框：Blue，添加蓝色阴影)
   - Error (边框：Error)
   - Disabled (背景：Gray-50，Opacity: 50%)

### 2.3 创建卡片组件

**创建基础卡片**
1. 创建Rectangle (命名为"Base Card")
2. 设置尺寸：400px × 300px
3. 设置填充：White
4. 设置圆角：16px
5. 添加Shadow/Card效果
6. 设置Auto Layout：
   - Direction: Vertical
   - Padding: 24px
   - Gap: 16px
7. 添加内容区域（用于放置内容）
8. 创建Component

## 🎨 第三步：创建专业组件

### 3.1 创建Logo组件

**品牌Logo**
1. 创建32px × 32px的Rectangle
2. 设置填充：Linear gradient (Blue → Purple → Pink, 135°)
3. 设置圆角：8px
4. 添加代码图标（白色，20px）
5. 创建Component，命名"Brand Logo"

### 3.2 创建导航栏组件

**顶部导航栏**
1. 创建Rectangle，全宽 × 64px
2. 设置填充：rgba(255,255,255,0.95)
3. 添加底部边框：1px, rgba(255,255,255,0.3)
4. 设置Auto Layout：
   - Direction: Horizontal
   - Padding: 0px vertical, 24px horizontal
   - Space between: 占满整个宽度
5. 左侧：Logo + 标题 "AI Workflow"
6. 中间：导航按钮组
7. 右侧：用户信息 + 登出按钮
8. 创建Component

### 3.3 创建工作流节点组件

**基础节点**
1. 创建Rectangle，120px × 80px
2. 设置填充：White
3. 设置圆角：8px
4. 设置边框：2px
5. 添加Light Shadow效果
6. 创建Auto Layout用于内容
7. 创建Component并添加Variants：
   - Start Node (绿色边框)
   - Agent Node (蓝色边框)
   - Condition Node (橙色边框)
   - Human Control Node (紫色边框)
   - End Node (红色边框)

### 3.4 创建状态徽章组件

**状态徽章**
1. 创建小的Rectangle
2. 设置圆角：50% (全圆角)
3. 创建Variants：
   - Active (绿色渐变背景)
   - Draft (黄色渐变背景)
   - Inactive (灰色渐变背景)
4. 添加白色文字
5. 设置Auto Layout，padding: 4px vertical, 12px horizontal

## 📱 第四步：构建页面布局

### 4.1 创建工作流管理页面

**页面结构**
1. 创建Frame，1440px × 1024px
2. 添加导航栏组件
3. 创建内容区域：
   - 头部：搜索框 + 创建按钮
   - 主体：卡片网格布局 (3-4列)
   - 每个卡片显示工作流信息
4. 使用Auto Layout保证响应式

### 4.2 创建工作流编辑器页面

**三栏布局**
1. 左侧栏：节点调色板 (240px宽)
2. 中间：画布区域 (自适应宽度)
3. 右侧栏：属性面板 (320px宽)
4. 底部：执行控制区 (固定高度)

### 4.3 创建执行管理页面

**布局结构**
1. 顶部：节点执行状态 (水平滚动)
2. 下方三列：
   - 左列：执行历史列表 (33%)
   - 右上：执行详情 (67%上半部分)  
   - 右下：最终输出 (67%下半部分)

## 🎯 第五步：添加交互和原型

### 5.1 设置页面连接
1. 选择导航按钮
2. 使用Prototype模式创建页面间链接
3. 设置过渡动画：Ease out，300ms

### 5.2 添加悬停效果
1. 选择按钮组件
2. 在Prototype模式下：
   - Trigger: On hover
   - Action: Change to (Hover variant)
   - Animation: Ease out，200ms

### 5.3 创建模态框交互
1. 创建遮罩层 (全屏，半透明黑色)
2. 添加模态框组件
3. 设置进入/退出动画

## 📋 第六步：组织和文档

### 6.1 整理组件库
1. 在Assets面板整理组件
2. 按功能分组：
   - 🔘 Buttons
   - 📝 Forms  
   - 📄 Cards
   - 🧭 Navigation
   - ⚡ Workflow
   - 📊 Execution

### 6.2 添加文档
1. 为每个组件添加描述
2. 说明使用场景和属性
3. 提供使用示例

## 🚀 第七步：测试和优化

### 7.1 响应式测试
1. 测试不同屏幕尺寸下的表现
2. 确保Auto Layout工作正常
3. 调整组件约束

### 7.2 原型测试
1. 测试用户流程是否流畅
2. 检查交互效果
3. 优化动画时长和缓动效果

## 💡 专业建议

### 最佳实践
1. **命名规范**：使用清晰的组件命名，如"Button/Primary/Default"
2. **版本控制**：定期保存组件库版本
3. **文档完善**：为每个组件写清楚的使用说明
4. **测试为先**：创建组件后立即测试各种状态
5. **保持一致**：严格遵循设计系统规范

### 效率提升技巧
- 善用快捷键：Ctrl+D (复制), Ctrl+G (分组), Alt+拖拽 (复制)
- 使用插件：Content Reel (填充内容), Figma to React (代码导出)
- 建立团队库：与开发团队共享组件库
- 定期更新：根据开发反馈优化组件

这个指南应该能帮你在Figma中完整重建AI Workflow Platform的界面设计！ 