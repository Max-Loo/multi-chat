# 测试辅助工具文档

本目录包含项目的测试辅助工具系统，提供标准化的 Mock、Fixtures 和测试工具函数。

## 目录结构

```
src/__test__/
├── README.md                    # 本文档
├── setup.ts                     # Vitest 全局设置文件
├── helpers/                     # Mock 工厂和测试工具
│   ├── index.ts                 # 统一导出
│   ├── mockTauri.ts            # Tauri API Mock
│   ├── mockCrypto.ts           # 加密相关 Mock
│   ├── mockStorage.ts          # 存储相关 Mock
│   ├── mockRedux.ts            # Redux Mock
│   └── fixtures/               # 测试数据 Fixtures
│       ├── models.ts           # Model 相关测试数据
│       ├── chat.ts             # 聊天相关测试数据
│       └── messages.ts         # 消息相关测试数据
├── utils/                       # 工具函数测试
├── hooks/                       # Hooks 测试
├── components/                  # 组件测试
└── integration/                 # 集成测试
```

## 快速开始

### 导入测试辅助工具

```typescript
// 统一导入所有测试辅助工具
import {
  // Mock 工厂
  createTauriMocks,
  createCryptoMocks,
  createStorageMocks,
  createReduxMocks,

  // 测试数据工厂
  createMockModel,
  createMockModels,
  createMockMessage,
  createMockChat,

  // 自定义断言
  expect,
} from '@/test-helpers';
```

## ChatPanel Mock 使用指南

### 基础 Mock 设置

```typescript
import { renderWithProviders } from '@/test-helpers';
import { ChatPanel } from '@/components/ChatPanel';

describe('ChatPanel', () => {
  // 创建基础 Mock
  const mocks = createTauriMocks({ isTauri: false });
  const cryptoMocks = createCryptoMocks();
  const storageMocks = createStorageMocks();

  beforeEach(() => {
    // 模拟 Tauri 环境
    mocks.windowMock.__TAURI__ = true;
  });

  afterEach(() => {
    // 重置所有 Mock
    mocks.resetAll();
    cryptoMocks.resetAll();
    storageMocks.resetAll();
  });

  it('should render messages', () => {
    // 创建测试数据
    const messages = createMockMessages(5);

    // 渲染组件
    const { getByText } = renderWithProviders(
      <ChatPanel messages={messages} />
    );

    // 断言
    expect(getByText(messages[0].content)).toBeInTheDocument();
  });
});
```

### 流式响应测试

```typescript
import { createStreamingResponseMock } from '@/test-helpers';

it('should handle streaming response', async () => {
  const mockStream = createStreamingResponseMock({
    chunks: ['Hello', ' world', '!'],
    delay: 100,
  });

  const { getByText } = renderWithProviders(
    <ChatPanel />
  );

  // 模拟流式响应
  await mockStream.simulate();

  // 断言
  expect(getByText('Hello world!')).toBeInTheDocument();
});
```

### 多模态消息测试

```typescript
import { createMockMessage } from '@/test-helpers';

it('should render multimodal messages', () => {
  const message = createMockMessage({
    type: 'multimodal',
    content: [
      { type: 'text', text: 'Check this image:' },
      { type: 'image', url: 'https://example.com/image.png' },
    ],
  });

  const { getByAltText } = renderWithProviders(
    <ChatPanel messages={[message]} />
  );

  expect(getByAltText(/image/i)).toBeInTheDocument();
});
```

### 错误处理测试

```typescript
import { createMockError } from '@/test-helpers';

it('should display error message', async () => {
  const mockError = createMockError({
    message: 'Network error',
    code: 'NETWORK_ERROR',
  });

  const mocks = createTauriMocks();
  mocks.fetch.mockRejectedValue(mockError);

  const { findByText } = renderWithProviders(<ChatPanel />);

  expect(await findByText(/network error/i)).toBeInTheDocument();
});
```

## Model 管理 Mock 使用指南

### 基础设置

```typescript
import { renderWithProviders } from '@/test-helpers';
import { ModelProviderSetting } from '@/components/ModelProviderSetting';

describe('ModelProviderSetting', () => {
  const mocks = createTauriMocks();
  const storageMocks = createStorageMocks();

  beforeEach(() => {
    // 设置默认 Model 数据
    const mockModels = createMockModels(3);
    storageMocks.store.get.mockResolvedValue(mockModels);
  });

  it('should render provider list', async () => {
    const { findByText } = renderWithProviders(
      <ModelProviderSetting />
    );

    expect(await findByText(/deepseek/i)).toBeInTheDocument();
    expect(await findByText(/kimi/i)).toBeInTheDocument();
  });
});
```

### 刷新功能测试

```typescript
it('should refresh providers', async () => {
  const { getByRole, user } = renderWithProviders(
    <ModelProviderSetting />
  );

  const refreshButton = getByRole('button', { name: /refresh/i });

  // 模拟点击刷新按钮
  await user.click(refreshButton);

  // 断言加载状态
  expect(getByRole('button', { name: /loading/i })).toBeInTheDocument();
});
```

### 删除供应商测试

```typescript
it('should delete provider', async () => {
  const mockModels = createMockModels(3);
  const storageMocks = createStorageMocks();

  const { getByRole, user } = renderWithProviders(
    <ModelProviderSetting models={mockModels} />
  );

  const deleteButton = getByRole('button', { name: /delete provider/i });
  await user.click(deleteButton);

  // 断言存储被调用
  expect(storageMocks.store.set).toHaveBeenCalledWith(
    'models',
    mockModels.slice(1)
  );
});
```

### API Key 管理测试

```typescript
it('should copy API key', async () => {
  const mockModel = createMockModel({
    apiKey: 'sk-test-key-123',
  });

  const { getByRole, user } = renderWithProviders(
    <ProviderCard model={mockModel} />
  );

  const copyButton = getByRole('button', { name: /copy api key/i });
  await user.click(copyButton);

  // 断言剪贴板 API 被调用
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('sk-test-key-123');
});
```

## Fixtures 使用示例

### Model Fixtures

```typescript
import { createMockModel, createMockModels } from '@/test-helpers/fixtures/models';

// 创建单个 Model
const model = createMockModel({
  id: 'deepseek-chat',
  name: 'DeepSeek Chat',
  apiKey: 'sk-test-key',
  baseUrl: 'https://api.deepseek.com',
});

// 批量创建 Model
const models = createMockModels(5, {
  provider: 'deepseek', // 所有模型使用相同供应商
});

// 创建带随机数据的 Model
const randomModel = createMockModel({
  randomize: true, // 自动生成随机 ID 和名称
});
```

### Chat Fixtures

```typescript
import { createMockChat, createMockChats } from '@/test-helpers/fixtures/chat';

// 创建单个聊天
const chat = createMockChat({
  id: 'chat-1',
  title: 'Test Chat',
  modelId: 'deepseek-chat',
  messages: createMockMessages(3),
});

// 批量创建聊天
const chats = createMockChats(5, {
  messageCount: 3, // 每个聊天包含 3 条消息
});
```

### Message Fixtures

```typescript
import { createMockMessage, createMockMessages } from '@/test-helpers/fixtures/messages';

// 创建用户消息
const userMessage = createMockMessage({
  role: 'user',
  content: 'Hello, how are you?',
});

// 创建助手消息（带推理内容）
const assistantMessage = createMockMessage({
  role: 'assistant',
  content: 'I am doing well!',
  reasoningContent: 'Let me think about this...',
});

// 批量创建消息
const messages = createMockMessages(5, {
  role: 'user', // 所有消息都是用户消息
});

// 创建多模态消息
const multimodalMessage = createMockMessage({
  role: 'user',
  content: [
    { type: 'text', text: 'What is in this image?' },
    { type: 'image', url: 'https://example.com/image.png' },
  ],
});
```

## 自定义断言

```typescript
import { expect } from '@/test-helpers';

// 断言值是加密格式
expect(value).toBeEncrypted();

// 断言值是有效的主密钥
expect(key).toBeValidMasterKey();

// 断言组件有特定的样式
expect(element).toHaveStyle({ display: 'flex' });

// 断言组件有特定的类名
expect(element).toHaveClass('active');
```

## 性能测试工具

```typescript
import { measurePerformance, expectDuration } from '@/test-helpers';

// 测量执行时间
const { result, duration } = await measurePerformance(async () => {
  return await someAsyncOperation();
});

console.log(`Operation took ${duration}ms`);

// 期望执行时间在阈值内
await expectDuration(async () => {
  await someOperation();
}, 1000); // 1 秒内完成
```

## 环境隔离

```typescript
import { resetTestState, useIsolatedTest } from '@/test-helpers';

// 手动重置测试状态
resetTestState();

// 自动配置隔离钩子
useIsolatedTest({
  onBeforeEach: () => {
    // 自定义初始化
    console.log('Test setup');
  },
  onAfterEach: () => {
    // 自定义清理
    console.log('Test cleanup');
  },
});
```

## 最佳实践

### 1. 始终重置 Mock

```typescript
afterEach(() => {
  mocks.resetAll();
});
```

### 2. 使用语义化的测试数据

```typescript
// 好的做法：使用 createMockModel
const model = createMockModel({ name: 'DeepSeek Chat' });

// 不好的做法：手动构建对象
const model = { id: '...', name: '...', /* ... */ };
```

### 3. 保持测试独立

```typescript
describe('Feature', () => {
  useIsolatedTest(); // 自动隔离每个测试

  it('test 1', () => {
    // 测试 1 不会影响测试 2
  });

  it('test 2', () => {
    // 测试 2 不受测试 1 影响
  });
});
```

### 4. 使用辅助工具简化测试

```typescript
// 好的做法：使用 renderWithProviders
const { getByText } = renderWithProviders(<Component />);

// 不好的做法：手动配置所有 Provider
render(
  <Provider store={store}>
    <BrowserRouter>
      <Component />
    </BrowserRouter>
  </Provider>
);
```

## i18next Mock 配置

对于使用国际化的组件，需要在测试中 Mock `react-i18next`：

```typescript
// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      // 支持函数式调用和字符串键调用
      if (typeof keyOrFn === 'function') {
        return keyOrFn({
          chat: {
            sendMessage: '发送消息',
            stopSending: '停止发送',
            typeMessage: '输入消息...',
          },
          common: {
            cancel: '取消',
          },
        });
      }
      // 字符串键调用
      const translations: Record<string, string> = {
        'chat.sendMessage': '发送消息',
        'chat.stopSending': '停止发送',
        'chat.typeMessage': '输入消息...',
        'common.cancel': '取消',
      };
      return translations[keyOrFn] || keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

**使用示例**：

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import MyComponent from '@/components/MyComponent';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      if (typeof keyOrFn === 'function') {
        return keyOrFn({ chat: { sendMessage: '发送消息' } });
      }
      return keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('MyComponent', () => {
  it('should render translated text', () => {
    render(<MyComponent />);
    expect(screen.getByText('发送消息')).toBeInTheDocument();
  });
});
```

**注意事项**：
- Mock 必须在文件顶层静态调用（Vitest 限制）
- 支持函数式和字符串键两种翻译调用方式
- 提供默认翻译文本以避免测试失败
- 对于动态翻译键，使用字符串键模式

## 相关文档

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/react)
- [项目 AGENTS.md](../../AGENTS.md) - 测试配置和命令
