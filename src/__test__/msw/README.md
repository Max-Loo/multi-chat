# MSW Handlers 使用指南

## 什么是 MSW？

MSW (Mock Service Worker) 是一个 API Mock 库，通过拦截网络请求返回 Mock 数据。

### 为什么使用 MSW？

**相比 `vi.mock` 的优势**：

| 优势 | 说明 |
|------|------|
| **更接近真实场景** | 使用真实的 `fetch` API，而非 Mock 函数 |
| **支持完整流程** | 可以测试网络错误、超时、重试等场景 |
| **服务端和客户端通用** | 同一套代码可用于测试环境和开发环境 |
| **类型安全** | 支持 TypeScript，提供完整的类型推断 |
| **易于维护** | Handler 独立于测试代码，可复用 |

### MSW vs vi.mock

```typescript
// ❌ vi.mock：需要 Mock 整个模块
vi.mock('@/utils/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'test' })),
}));

// ✅ MSW：只拦截网络请求
server.use(
  rest.get('/api/data', (req, res, ctx) => {
    return res(ctx.json({ data: 'test' }));
  })
);
```

## 可用的 Handlers

项目已为所有主要 API 提供了预配置的 MSW handlers：

| Handler | 用途 | 文件位置 |
|---------|------|---------|
| `deepSeekHandlers` | DeepSeek API | `handlers/deepseek.ts` |
| `kimiHandlers` | Moonshot AI (Kimi) API | `handlers/kimi.ts` |
| `zhipuHandlers` | ZhipuAI API | `handlers/zhipu.ts` |
| `modelsDevHandlers` | models.dev API | `handlers/models-dev.ts` |

## 快速开始

### 1. 导入 Handlers

```typescript
import { server } from '@/__test__/msw/setup';
import { deepSeekHandlers } from '@/__test__/msw/handlers';
```

### 2. 在测试中使用

```typescript
describe('ChatService', () => {
  beforeEach(() => {
    // 使用 DeepSeek 成功场景
    server.use(deepSeekHandlers.success());
  });

  it('应该返回流式响应', async () => {
    const response = await streamChatCompletion(messages);
    expect(response).toBeDefined();
  });
});
```

### 3. 清理 Handlers

```typescript
afterEach(() => {
  server.resetHandlers();
});
```

## 场景配置

### DeepSeek Handlers

```typescript
import { deepSeekHandlers } from '@/__test__/msw/handlers';

// 成功场景（默认延迟 0ms，返回 "你好！我是 DeepSeek。"）
server.use(deepSeekHandlers.success());

// 成功场景（自定义延迟 1 秒）
server.use(deepSeekHandlers.success({ delay: 1000 }));

// 成功场景（自定义响应流）
const customStream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode('data: {"text": "Hello"}\n\n'));
    controller.close();
  },
});
server.use(deepSeekHandlers.success({ response: customStream }));

// 网络错误场景（模拟网络连接失败）
server.use(deepSeekHandlers.networkError());

// 超时场景（默认 30 秒）
server.use(deepSeekHandlers.timeout());

// 超时场景（自定义延迟 10 秒）
server.use(deepSeekHandlers.timeout({ delay: 10000 }));

// 服务器错误场景（默认 500）
server.use(deepSeekHandlers.serverError());

// 服务器错误场景（自定义状态码和消息）
server.use(deepSeekHandlers.serverError({ status: 503, message: 'Service Unavailable' }));
```

### Kimi Handlers

```typescript
import { kimiHandlers } from '@/__test__/msw/handlers';

// 使用方式与 deepSeekHandlers 相同
server.use(kimiHandlers.success());
server.use(kimiHandlers.networkError());
```

### Zhipu Handlers

```typescript
import { zhipuHandlers } from '@/__test__/msw/handlers';

// 使用方式与 deepSeekHandlers 相同
server.use(zhipuHandlers.success());
server.use(zhipuHandlers.networkError());
```

### models.dev Handlers

```typescript
import { modelsDevHandlers } from '@/__test__/msw/handlers';

// 成功场景（返回完整的供应商数据）
server.use(modelsDevHandlers.success());

// 网络错误场景
server.use(modelsDevHandlers.networkError());
```

## Handler 参数化配置

### StreamOptions 接口

所有供应商的 `success` handler 都接受 `StreamOptions` 参数：

```typescript
interface StreamOptions {
  /** 自定义响应流 */
  response?: ReadableStream;
  /** 响应延迟（毫秒） */
  delay?: number;
  /** 完成原因 */
  finishReason?: string;
  /** Token 使用统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}
```

### 自定义流式响应

```typescript
import { createDeepSeekProvider } from '@/__test__/fixtures';

// 创建自定义流
const customStream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();

    // 模拟逐字返回
    const chunks = ['Hello', ' World', '!'];
    for (const chunk of chunks) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'text-delta', text: chunk })}\n\n`
        )
      );
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    controller.close();
  },
});

server.use(deepSeekHandlers.success({ response: customStream }));
```

## 创建新 Handler

### 1. 创建 Handler 文件

在 `src/__test__/msw/handlers/` 目录下创建新文件，如 `openai.ts`：

```typescript
/**
 * OpenAI API MSW Handlers
 */

import { http, HttpResponse, delay } from 'msw';
import type { StreamOptions, ApiHandlerFactory } from '../types';

const createDefaultStream = (text: string): ReadableStream => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const words = text.split('');
      for (const word of words) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'text-delta', text: word })}\n\n`
          )
        );
        await delay(10);
      }
      controller.close();
    },
  });
};

export const openaiHandlers: ApiHandlerFactory = {
  success: (options: StreamOptions = {}) =>
    http.post('https://api.openai.com/v1/chat/completions', async () => {
      const { response, delay: responseDelay = 0 } = options;

      if (responseDelay > 0) {
        await delay(responseDelay);
      }

      const stream = response ?? createDefaultStream('Hello! I am GPT-4.');

      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }),

  networkError: () =>
    http.post('https://api.openai.com/v1/chat/completions', () => {
      return HttpResponse.error();
    }),

  timeout: (options: { delay: number } = { delay: 30000 }) =>
    http.post('https://api.openai.com/v1/chat/completions', async () => {
      await delay(options.delay);
      return HttpResponse.json({ error: 'Request timeout' }, { status: 408 });
    }),

  serverError: (
    options: { status: number; message: string } = {
      status: 500,
      message: 'Internal Server Error',
    }
  ) =>
    http.post('https://api.openai.com/v1/chat/completions', () => {
      return HttpResponse.json({ error: options.message }, {
        status: options.status,
      });
    }),
};

export const openaiHandlersList = [openaiHandlers.success()];
```

### 2. 在 index.ts 中导出

```typescript
// src/__test__/msw/handlers/index.ts

import {
  openaiHandlers,
  openaiHandlersList,
} from './openai';

// 重新导出
export {
  openaiHandlers,
  openaiHandlersList,
};

// 添加到 allHandlers
export const allHandlers = [
  ...deepSeekHandlersList,
  ...kimiHandlersList,
  ...zhipuHandlersList,
  ...modelsDevHandlersList,
  ...openaiHandlersList,  // 新增
];
```

### 3. 在测试中使用

```typescript
import { openaiHandlers } from '@/__test__/msw/handlers';

describe('OpenAI Service', () => {
  beforeEach(() => {
    server.use(openaiHandlers.success());
  });

  it('应该返回流式响应', async () => {
    // ...
  });
});
```

## 集成测试中的使用

### 完整聊天流程测试

```typescript
import { server } from '@/__test__/msw/setup';
import { deepSeekHandlers } from '@/__test__/msw/handlers';
import { render, screen } from '@testing-library/react';
import { createTestStore } from '@/__test__/helpers/mocks/redux';

describe('聊天流程集成测试', () => {
  beforeEach(() => {
    // Mock API 请求
    server.use(deepSeekHandlers.success({ delay: 500 }));
  });

  it('应该完成完整聊天流程', async () => {
    const store = createTestStore();
    render(<App store={store} />);

    // 用户输入消息
    await userEvent.type(screen.getByRole('textbox'), 'Hello');
    await userEvent.click(screen.getByText('发送'));

    // 验证助手回复
    expect(await screen.findByText('你好！我是 DeepSeek。')).toBeInTheDocument();
  });
});
```

### 错误处理测试

```typescript
describe('错误处理', () => {
  it('应该显示错误提示 当网络请求失败', async () => {
    server.use(deepSeekHandlers.networkError());

    render(<ChatPanel />);

    await userEvent.click(screen.getByText('发送'));

    expect(await screen.findByText('网络错误')).toBeInTheDocument();
  });

  it('应该重试请求 当超时', async () => {
    server.use(deepSeekHandlers.timeout({ delay: 5000 }));

    // 测试重试逻辑
    // ...
  });
});
```

## CORS 处理

### 问题背景

MSW 默认会拦截所有请求，包括 CORS preflight 请求（OPTIONS）。这可能导致测试报告 "Network error" 或 "CORS policy" 错误。

### 解决方案

在 `setup.ts` 中配置 `onUnhandledRequest: 'bypass'`：

```typescript
// src/__test__/msw/setup.ts

import { setupServer } from 'msw/node';
import { allHandlers } from './handlers';

export const server = setupServer(
  ...allHandlers,
  {
    // 跳过未处理的请求（如 CORS preflight）
    onUnhandledRequest: 'bypass',
  }
);
```

### 验证 CORS 问题修复

```bash
# 运行集成测试
pnpm test:integration chat-flow.integration.test.ts

# 应该不再报告 CORS 错误
```

## 最佳实践

### 1. 始终在测试后重置 Handlers

```typescript
afterEach(() => {
  server.resetHandlers(); // 恢复默认 handlers
});

afterAll(() => {
  server.close(); // 关闭 MSW server
});
```

### 2. 使用描述性的场景配置

```typescript
// ✅ 好：描述性强
server.use(deepSeekHandlers.success({ delay: 1000 }));

// ❌ 不好：使用魔法数字
server.use(deepSeekHandlers.success({ delay: 1000 }));
```

### 3. 组合多个 Handlers

```typescript
beforeEach(() => {
  server.use(
    deepSeekHandlers.success(),
    modelsDevHandlers.success(),
  );
});
```

### 4. 使用 Fixtures 创建测试数据

```typescript
import { createDeepSeekProvider } from '@/__test__/fixtures';

server.use(
  rest.get('https://models.dev/api.json', (req, res, ctx) => {
    return res(ctx.json([createDeepSeekProvider()]));
  })
);
```

## 常见错误和解决方案

### 错误 1：请求未被拦截

**问题**：测试中真实的网络请求未被 MSW 拦截。

**解决方案**：
1. 确认 MSW server 已启动（在 `beforeAll` 中调用 `server.listen()`）
2. 确认 handler 的 URL 匹配（使用 `rest.get`/`rest.post` 的第一个参数）
3. 检查是否有多个 handler 匹配同一个 URL

### 错误 2：Handler 不生效

**问题**：在测试中调用了 `server.use()`，但 handler 不生效。

**解决方案**：
1. 确认在 `beforeEach` 中调用 `server.use()`
2. 确认在 `afterEach` 中调用 `server.resetHandlers()`
3. 检查 handler 的 URL 是否正确

### 错误 3：CORS 错误

**问题**：测试报告 "Network error" 或 "CORS policy" 错误。

**解决方案**：
1. 确认 `setup.ts` 中配置了 `onUnhandledRequest: 'bypass'`
2. 确认没有额外的 CORS handler

### 错误 4：流式响应不完整

**问题**：流式响应的数据不完整或格式错误。

**解决方案**：
1. 确认流式响应格式符合供应商 API 规范
2. 使用 `await delay()` 模拟网络延迟
3. 确认 `controller.close()` 被调用

## 性能优化

### 1. 减少延迟

```typescript
// 测试环境使用最小延迟
server.use(deepSeekHandlers.success({ delay: 10 }));
```

### 2. 使用简单的响应

```typescript
// 测试环境使用简短的响应
server.use(deepSeekHandlers.success({ response: simpleStream }));
```

### 3. 并行测试

```typescript
// 确保测试之间完全独立
describe('并行测试', () => {
  beforeEach(() => {
    server.use(deepSeekHandlers.success());
  });

  afterEach(() => {
    server.resetHandlers();
  });
});
```

## 相关文档

- [测试辅助工具文档](../README.md)
- [Fixtures 使用指南](../fixtures/README.md)
- [集成测试指南](../integration/README.md)
- [MSW 官方文档](https://mswjs.io/)
- [MSW Recipes](https://mswjs.io/docs/recipes)
