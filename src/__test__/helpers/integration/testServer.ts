import { http, HttpResponse } from 'msw'
import type { SetupServer } from 'msw/node'

/**
 * MSW Server 配置
 * 提供 Mock API handlers
 */

/**
 * DeepSeek API handlers
 */
export const deepSeekHandlers = [
  /**
   * Mock CORS 预检请求
   */
  http.options('https://api.deepseek.com/chat/completions', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }),

  /**
   * Mock DeepSeek 聊天完成接口
   */
  http.post('https://api.deepseek.com/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'deepseek-chat',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '这是 Mock 的响应内容',
          },
          finish_reason: 'stop',
        },
      ],
    })
  }),

  /**
   * Mock DeepSeek 流式响应接口
   */
  http.post('https://api.deepseek.com/chat/completions', async ({ request }) => {
    const body = await request.json() as { stream?: boolean }
    
    if (body.stream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          const chunks = ['你', '好', '！', '有', '什', '么', '可', '以', '帮', '助', '？']
          
          for (const chunk of chunks) {
            const data = `data: ${JSON.stringify({
              id: 'chatcmpl-test',
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: 'deepseek-chat',
              choices: [
                {
                  index: 0,
                  delta: { content: chunk },
                  finish_reason: null,
                },
              ],
            })}\n\n`
            
            controller.enqueue(encoder.encode(data))
            await new Promise(resolve => setTimeout(resolve, 50))
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      })
      
      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }
    
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'deepseek-chat',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '这是 Mock 的响应内容',
          },
          finish_reason: 'stop',
        },
      ],
    })
  }),

  /**
   * Mock DeepSeek API 错误响应
   */
  http.post('https://api.deepseek.com/chat/completions', () => {
    return HttpResponse.json(
      {
        error: {
          message: 'Invalid API key',
          type: 'invalid_request_error',
          code: 'invalid_api_key',
        },
      },
      { status: 401 }
    )
  }),
]

/**
 * Kimi API handlers
 */
export const kimiHandlers = [
  http.post('https://api.moonshot.cn/v1/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'moonshot-v1-8k',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '这是 Kimi Mock 的响应内容',
          },
          finish_reason: 'stop',
        },
      ],
    })
  }),
]

/**
 * Zhipu API handlers
 */
export const zhipuHandlers = [
  http.post('https://open.bigmodel.cn/api/paas/v4/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'glm-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '这是智谱 Mock 的响应内容',
          },
          finish_reason: 'stop',
        },
      ],
    })
  }),
]

/**
 * 通用 API handlers
 */
export const commonHandlers = [
  /**
   * Mock 网络超时
   */
  http.post('*', async () => {
    await new Promise(resolve => setTimeout(resolve, 35000))
    return HttpResponse.json(
      { error: 'Request timeout' },
      { status: 408 }
    )
  }),
]

/**
 * 配置 MSW server
 */
export function setupTestServer(server: SetupServer): void {
  server.use(
    ...deepSeekHandlers,
    ...kimiHandlers,
    ...zhipuHandlers,
  )
}

/**
 * 设置错误处理 handlers
 */
export function setupErrorHandlers(server: SetupServer): void {
  server.use(
    http.post('**/chat/completions', () => {
      return HttpResponse.json(
        { error: { message: 'Internal Server Error' } },
        { status: 500 }
      )
    })
  )
}

/**
 * 设置超时 handlers
 */
export function setupTimeoutHandlers(server: SetupServer): void {
  server.use(
    http.post('**/chat/completions', async () => {
      await new Promise(resolve => setTimeout(resolve, 35000))
      return HttpResponse.json(
        { error: { message: 'Request timeout' } },
        { status: 408 }
      )
    })
  )
}
