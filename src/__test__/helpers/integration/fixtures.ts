import { getCurrentTimestamp } from '@/utils/utils'
import type { StandardMessage } from '@/types/chat'
import type { Model } from '@/types/model'

/**
 * 集成测试 Fixtures
 * 提供预定义的测试数据
 */

export const integrationFixtures = {
  /**
   * 完整的聊天会话
   */
  chatSession: {
    id: 'test-chat-1',
    title: '测试对话',
    modelId: 'deepseek-chat',
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    messages: [
      {
        role: 'user',
        content: '你好',
        timestamp: getCurrentTimestamp(),
      },
      {
        role: 'assistant',
        content: '你好！有什么可以帮助你的？',
        timestamp: getCurrentTimestamp(),
      },
    ] as StandardMessage[],
  },

  /**
   * 完整的模型配置
   */
  modelConfig: {
    id: 'model-1',
    providerName: 'DeepSeek',
    providerKey: 'deepseek',
    nickname: 'DeepSeek Chat',
    apiKey: 'sk-test-123',
    apiAddress: 'https://api.deepseek.com',
    modelKey: 'deepseek-chat',
    modelName: 'DeepSeek Chat',
    isEnable: true,
  } as Model,

  /**
   * API 响应 Mock 数据
   */
  apiResponse: {
    streaming: true,
    chunks: ['你好', '！', '有什么', '可以', '帮助', '你的', '？'],
    fullResponse: '你好！有什么可以帮助你的？',
  },

  /**
   * 流式响应 chunks
   */
  streamingChunks: [
    '你好',
    '！',
    ' 有',
    ' 什么',
    ' 可以',
    ' 帮助',
    ' 你的',
    ' ？',
  ],

  /**
   * API 错误响应
   */
  apiError: {
    status: 500,
    message: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  },

  /**
   * 用户消息
   */
  userMessage: {
    role: 'user' as const,
    content: '这是一条测试消息',
    timestamp: getCurrentTimestamp(),
  } as StandardMessage,

  /**
   * 助手消息
   */
  assistantMessage: {
    role: 'assistant' as const,
    content: '这是助手的回复',
    timestamp: getCurrentTimestamp(),
  } as StandardMessage,

  /**
   * 推理内容消息
   */
  reasoningMessage: {
    id: 'msg-reasoning-1',
    timestamp: getCurrentTimestamp(),
    modelKey: 'deepseek-chat',
    role: 'assistant' as const,
    content: '最终答案',
    reasoningContent: '这是推理过程',
    finishReason: 'stop',
  } as StandardMessage,
}
