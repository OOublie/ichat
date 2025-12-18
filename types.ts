
export type Role = 'user' | 'model' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface ChatConfig {
  modelName: string;
  apiKeys: string[];
  baseUrl: string; // 新增：支持第三方接口地址
  systemInstruction: string;
  temperature: number;
}
