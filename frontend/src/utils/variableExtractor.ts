import { WorkflowNode, NodeType } from '../types/workflow';

export interface Variable {
  name: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: NodeType;
  source: 'output' | 'initial';
}

/**
 * Extract all defined variables from workflow nodes
 */
export const extractVariablesFromNodes = (nodes: WorkflowNode[]): Variable[] => {
  const variables: Variable[] = [];

  nodes.forEach(node => {
    const config = node.data.config || {};
    
    switch (node.type) {
      case NodeType.START:
        // Extract from initial variables
        if (config.initialVariables) {
          try {
            const initialVars = JSON.parse(config.initialVariables);
            Object.keys(initialVars).forEach(varName => {
              variables.push({
                name: varName,
                nodeId: node.id,
                nodeLabel: node.data.label || 'Start',
                nodeType: node.type,
                source: 'initial'
              });
            });
          } catch (err) {
            // Ignore JSON parsing errors
          }
        }
        break;

      case NodeType.AGENT:
        // Agent节点的输出直接传递给下一个节点，不作为变量引用
        // 因此不提取outputVariable作为可用变量
        break;

      case NodeType.IF:
        // Condition nodes usually don't define new variables, only use existing ones
        break;

      case NodeType.END:
        // End nodes usually don't define new variables
        break;

      default:
        break;
    }
  });

  return variables;
};

/**
 * Extract Jinja2 template variable references from text
 */
export const extractVariableReferences = (text: string): string[] => {
  const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const varName = match[1];
    if (!matches.includes(varName)) {
      matches.push(varName);
    }
  }

  return matches;
};

/**
 * Validate variable name
 */
export const isValidVariableName = (name: string): boolean => {
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return regex.test(name);
}; 