import { ModelProvider } from '@/types/model';
import { ModelProviderKeyEnum } from './enums';

// 支持的AI大模型服务商列表
export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    key: ModelProviderKeyEnum.DEEPSEEK,
    name: '深度求索',
    logoUrl: 'https://deepseek.com/favicon.ico',
    officialSite: 'https://www.deepseek.com/',
    defaultApiAddress: 'https://api.deepseek.com',
  },
  {
    key: ModelProviderKeyEnum.KIMI,
    name: '月之暗面',
    logoUrl: 'https://kimi.moonshot.cn/favicon.ico',
    defaultApiAddress: 'https://api.moonshot.cn',
  },
  {
    key: ModelProviderKeyEnum.BIG_MODEL,
    name: '智谱AI',
    logoUrl: 'https://bigmodel.cn/favicon.ico',
    defaultApiAddress: 'https://open.bigmodel.cn/api/paas/v4/',
  },
  // {
  //   key: ModelProviderKeyEnum.OPEN_AI,
  //   name: 'OpenAI',
  //   logoUrl: 'https://openai.com/favicon.ico',
  //   defaultApiAddress: '',
  // },
];

// 本地存储的键名
export const STORAGE_KEY = 'models';