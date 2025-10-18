import { ModelProvider } from '@/types/model';
import { ModelProviderKeyEnum } from './enums';

// 支持的AI大模型服务商列表
export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    key: ModelProviderKeyEnum.DEEPSEEK,
    name: '深度求索',
    logoUrl: 'https://deepseek.com/favicon.ico'
  },
  {
    key: ModelProviderKeyEnum.KIMI,
    name: 'Kimi',
    logoUrl: 'https://kimi.moonshot.cn/favicon.ico'
  },
  {
    key: ModelProviderKeyEnum.BIG_MODEL,
    name: '智谱AI',
    logoUrl: 'https://bigmodel.cn/favicon.ico'
  },
  {
    key: ModelProviderKeyEnum.OPEN_AI,
    name: 'OpenAI',
    logoUrl: 'https://openai.com/favicon.ico'
  },
];

// 本地存储的键名
export const STORAGE_KEY = 'models';