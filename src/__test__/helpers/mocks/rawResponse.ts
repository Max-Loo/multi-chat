/**
 * @description Mock 原始响应数据
 * 
 * 提供不同供应商（DeepSeek、MoonshotAI、Zhipu）的 Mock 原始响应数据，用于测试
 */

import type { StandardMessageRawResponse } from '@/types/chat';

/**
 * @description 基础 Mock 原始响应数据
 */
export const mockRawResponseBase: StandardMessageRawResponse = {
  response: {
    id: 'chatcmpl-123',
    modelId: 'deepseek-chat',
    timestamp: '2024-01-01T00:00:00.000Z',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-123',
    },
  },
  request: {
    body: '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello"}]}',
  },
  usage: {
    inputTokens: 100,
    outputTokens: 50,
    totalTokens: 150,
    inputTokenDetails: {
      cacheReadTokens: 20,
      cacheWriteTokens: 0,
      noCacheTokens: 80,
    },
    outputTokenDetails: {
      textTokens: 40,
      reasoningTokens: 10,
    },
  },
  finishReason: {
    reason: 'stop',
    rawReason: 'stop',
  },
  providerMetadata: {
    deepseek: {
      version: '2024-01-01',
    },
  },
  warnings: [],
  streamStats: {
    textDeltaCount: 50,
    reasoningDeltaCount: 10,
    duration: 1500,
  },
};

/**
 * @description DeepSeek 供应商的 Mock 原始响应数据（推理模型）
 */
export const mockRawResponseDeepSeek: StandardMessageRawResponse = {
  response: {
    id: 'chatcmpl-deepseek-456',
    modelId: 'deepseek-reasoner',
    timestamp: '2024-01-15T12:30:45.000Z',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-deepseek-456',
      'x-ratelimit-remaining': '100',
    },
  },
  request: {
    body: '{"model":"deepseek-reasoner","messages":[{"role":"user","content":"Explain quantum computing"}],"apiKey":"***REMOVED***"}',
  },
  usage: {
    inputTokens: 200,
    outputTokens: 300,
    totalTokens: 500,
    inputTokenDetails: {
      cacheReadTokens: 50,
      cacheWriteTokens: 0,
      noCacheTokens: 150,
    },
    outputTokenDetails: {
      textTokens: 200,
      reasoningTokens: 100,
    },
  },
  finishReason: {
    reason: 'stop',
    rawReason: 'stop',
  },
  providerMetadata: {
    deepseek: {
      version: '2024-01-15',
      reasoningTokens: 100,
    },
  },
  warnings: [],
  streamStats: {
    textDeltaCount: 200,
    reasoningDeltaCount: 100,
    duration: 5000,
  },
};

/**
 * @description MoonshotAI 供应商的 Mock 原始响应数据
 */
export const mockRawResponseMoonshotAI: StandardMessageRawResponse = {
  response: {
    id: 'chatcmpl-moonshot-789',
    modelId: 'moonshot-v1-8k',
    timestamp: '2024-02-01T08:15:30.000Z',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-moonshot-789',
    },
  },
  request: {
    body: '{"model":"moonshot-v1-8k","messages":[{"role":"user","content":"Tell me a joke"}]}',
  },
  usage: {
    inputTokens: 80,
    outputTokens: 60,
    totalTokens: 140,
  },
  finishReason: {
    reason: 'stop',
    rawReason: 'stop',
  },
  providerMetadata: {
    moonshotai: {
      apiVersion: 'v2',
      modelVersion: '1.0',
    },
  },
  warnings: [
    {
      code: 'deprecated',
      message: 'This model version is deprecated, please upgrade to moonshot-v2-8k',
    },
  ],
  streamStats: {
    textDeltaCount: 60,
    reasoningDeltaCount: 0,
    duration: 1200,
  },
};

/**
 * @description Zhipu 供应商的 Mock 原始响应数据（web search RAG 模型）
 */
export const mockRawResponseZhipu: StandardMessageRawResponse = {
  response: {
    id: 'chatcmpl-zhipu-101',
    modelId: 'glm-web-search',
    timestamp: '2024-02-15T18:45:00.000Z',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-zhipu-101',
    },
  },
  request: {
    body: '{"model":"glm-web-search","messages":[{"role":"user","content":"What is the latest news about AI?"}],"tools":["web_search"]}',
  },
  usage: {
    inputTokens: 150,
    outputTokens: 200,
    totalTokens: 350,
    inputTokenDetails: {
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      noCacheTokens: 150,
    },
  },
  finishReason: {
    reason: 'stop',
    rawReason: 'stop',
  },
  providerMetadata: {
    zhipu: {
      apiVersion: 'v3',
      requestType: 'web_search',
    },
  },
  warnings: [],
  streamStats: {
    textDeltaCount: 200,
    reasoningDeltaCount: 0,
    duration: 3000,
  },
  sources: [
    {
      sourceType: 'url',
      id: 'src-1',
      url: 'https://example.com/article1',
      title: 'Latest AI News Article 1',
      providerMetadata: {
        score: 0.95,
      },
    },
    {
      sourceType: 'url',
      id: 'src-2',
      url: 'https://example.com/article2',
      title: 'Latest AI News Article 2',
      providerMetadata: {
        score: 0.87,
      },
    },
    {
      sourceType: 'url',
      id: 'src-3',
      url: 'https://example.com/article3',
      title: 'Latest AI News Article 3',
      providerMetadata: {
        score: 0.82,
      },
    },
  ],
};

/**
 * @description 包含错误信息的 Mock 原始响应数据
 */
export const mockRawResponseWithErrors: StandardMessageRawResponse = {
  response: {
    id: 'chatcmpl-error-202',
    modelId: 'deepseek-chat',
    timestamp: '2024-03-01T10:00:00.000Z',
    headers: {
      'content-type': 'application/json',
    },
  },
  request: {
    body: '{"model":"deepseek-chat","messages":[{"role":"user","content":"Test"}]}',
  },
  usage: {
    inputTokens: 50,
    outputTokens: 30,
    totalTokens: 80,
  },
  finishReason: {
    reason: 'error',
    rawReason: 'network_error',
  },
  providerMetadata: {},
  warnings: [
    {
      code: 'network_error',
      message: 'Failed to fetch response headers',
    },
  ],
  streamStats: {
    textDeltaCount: 30,
    reasoningDeltaCount: 0,
    duration: 1000,
  },
};

/**
 * @description 最小化的 Mock 原始响应数据（仅包含必需字段）
 */
export const mockRawResponseMinimal: StandardMessageRawResponse = {
  response: {
    id: 'chatcmpl-minimal-303',
    modelId: 'gpt-3.5-turbo',
    timestamp: '2024-03-15T14:20:00.000Z',
  },
  request: {
    body: '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hi"}]}',
  },
  usage: {
    inputTokens: 10,
    outputTokens: 5,
    totalTokens: 15,
  },
  finishReason: {
    reason: 'stop',
    rawReason: 'stop',
  },
  streamStats: {
    textDeltaCount: 5,
    reasoningDeltaCount: 0,
    duration: 500,
  },
};
