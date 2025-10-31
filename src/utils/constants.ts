import { ModelProvider } from '@/types/model';
import { ModelProviderKeyEnum } from './enums';

// 支持的AI大模型服务商列表
export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    key: ModelProviderKeyEnum.DEEPSEEK,
    name: '深度求索',
    logoUrl: 'https://deepseek.com/favicon.ico',
    officialSite: 'https://www.deepseek.com/',
    defaultConfig: {
      apiAddress: 'https://api.deepseek.com',
      modelList: [
        { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
        { modelKey: 'deepseek-reasoner', modelName: 'DeepSeek Reasoner' },
      ],
    },
  },
  {
    key: ModelProviderKeyEnum.KIMI,
    name: '月之暗面',
    logoUrl: 'https://kimi.moonshot.cn/favicon.ico',
    defaultConfig: {
      apiAddress: 'https://api.moonshot.cn',
      modelList: [
        { modelKey: 'moonshot-v1-auto', modelName: 'moonshot-v1-auto' },
      ],
    },
  },
  {
    key: ModelProviderKeyEnum.BIG_MODEL,
    name: '智谱AI',
    logoUrl: 'https://bigmodel.cn/favicon.ico',
    defaultConfig: {
      apiAddress: 'https://open.bigmodel.cn/api/paas/v4/',
      modelList: [
        { modelKey: 'glm-4.5', modelName: 'GLM-4.5' },
        { modelKey: 'glm-4.6', modelName: 'GLM-4.6' },
      ],
    },
  },
  // {
  //   key: ModelProviderKeyEnum.OPEN_AI,
  //   name: 'OpenAI',
  //   logoUrl: 'https://openai.com/favicon.ico',
  //   defaultApiAddress: '',
  // },
];

