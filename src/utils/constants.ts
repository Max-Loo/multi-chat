import { ModelProvider } from '@/types/model';

// 支持的AI大模型服务商列表
export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    key: 'deepseek',
    name: '深度求索',
    logoUrl: 'https://deepseek.com/favicon.ico'
  },
  {
    key: 'kimi',
    name: 'Kimi',
    logoUrl: 'https://kimi.moonshot.cn/favicon.ico'
  },
  {
    key: 'bigmodel',
    name: '智谱AI',
    logoUrl: 'https://bigmodel.cn/favicon.ico'
  },
  {
    key: 'openai',
    name: 'OpenAI',
    logoUrl: 'https://openai.com/favicon.ico'
  },
  {
    key: 'anthropic',
    name: 'Anthropic',
    logoUrl: 'https://anthropic.com/favicon.ico'
  }
];

// 本地存储的键名
export const STORAGE_KEY = 'models';