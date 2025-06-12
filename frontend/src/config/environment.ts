// 环境变量配置
export const config = {
  // API基础URL
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
  
  // 外部Agent服务URL  
  externalAgentUrl: process.env.REACT_APP_EXTERNAL_AGENT_URL,
  
  // 完整的API URL
  get apiUrl() {
    return `${this.apiBaseUrl}/api`;
  },
  
  // 外部Agent API URL
  get externalAgentApiUrl() {
    return `${this.externalAgentUrl}/api/chatbycard`;
  },
  
  // 开发模式检测
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // 生产模式检测
  isProduction: process.env.NODE_ENV === 'production'
};

export default config; 