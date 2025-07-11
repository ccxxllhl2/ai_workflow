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
        // Extract from new startVariables format (preferred)
        if (config.startVariables && Array.isArray(config.startVariables)) {
          config.startVariables.forEach((variable: any) => {
            if (variable.name && variable.name.trim()) {
              variables.push({
                name: variable.name,
                nodeId: node.id,
                nodeLabel: node.data.label || 'Start',
                nodeType: node.type,
                source: 'initial'
              });
            }
          });
        } else if (config.initialVariables) {
          // Fallback to old initialVariables format for backwards compatibility
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

      case NodeType.HUMAN_CONTROL:
        // Human control nodes may modify variables, but usually don't define new ones
        // This can be extended as needed
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