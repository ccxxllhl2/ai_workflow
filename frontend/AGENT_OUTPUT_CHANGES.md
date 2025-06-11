# Agent节点输出方式更改

## 更改内容

### 移除Agent节点的变量输出机制

之前Agent节点会将输出保存为一个名为 `agent_output` 的变量，这个变量可以在后续节点中被引用。现在已经移除了这个机制。

### 新的输出方式

Agent节点的输出现在直接传递给下一个节点，作为下一个节点输入文本的最开始内容。这样更加直观和简洁。

## 技术实现

### 修改的文件

1. **frontend/src/utils/variableExtractor.ts**
   - 移除了从Agent节点提取 `outputVariable` 的逻辑
   - Agent节点不再在可用变量列表中显示输出变量

2. **frontend/src/components/WorkflowEditor.tsx**
   - 移除了Agent节点默认配置中的 `outputVariable: 'agent_output'`
   - 新创建的Agent节点不再包含输出变量字段

### 代码更改详情

```typescript
// 之前的代码
case NodeType.AGENT:
  // Extract from output variables
  if (config.outputVariable) {
    variables.push({
      name: config.outputVariable,
      nodeId: node.id,
      nodeLabel: node.data.label || 'AI Agent',
      nodeType: node.type,
      source: 'output'
    });
  }
  break;

// 现在的代码
case NodeType.AGENT:
  // Agent节点的输出直接传递给下一个节点，不作为变量引用
  // 因此不提取outputVariable作为可用变量
  break;
```

## 影响

- Agent节点编辑界面中的变量标签将不再显示来自其他Agent节点的输出变量
- 工作流设计更加简洁，减少了不必要的变量引用
- Agent节点的输出直接流转到下一个节点，提高了工作流的可读性

## 测试建议

1. 创建包含多个Agent节点的工作流
2. 确认Agent节点的输出变量不再显示在变量标签中
3. 确认Agent节点的输出可以正常传递给下一个节点
4. 验证工作流的执行流程正常 