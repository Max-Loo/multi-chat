# 测试辅助工具文档

本目录提供标准化的 Mock、Fixtures 和测试工具函数。

<!-- Tasks completed: 1.2, 1.3, 1.4, 1.5, 1.6 -->

## 目录结构

```
src/__test__/
├── README.md                    # 本文档
├── setup.ts                     # Vitest 全局设置
├── setup/                       # 设置子模块
├── helpers/                     # 测试辅助工具
│   ├── index.ts                 # 统一导出
│   ├── testing-utils.tsx        # 渲染和测试工具
│   ├── mocks/                   # Mock 工厂
│   │   ├── aiSdk.ts             # AI SDK Mock
│   │   ├── tauriCompat.ts       # Tauri 兼容层 Mock
│   │   ├── storage.ts           # 存储 Mock
│   │   ├── fetch.ts             # Fetch API Mock
│   │   ├── router.ts            # Router Mock
│   │   ├── chatPanel.ts         # ChatPanel Mock
│   │   ├── chatSidebar.ts       # ChatSidebar Mock
│   │   ├── i18n.ts              # 国际化 Mock
│   │   ├── highlight.ts         # 代码高亮 Mock
│   │   ├── toast.ts             # Toast Mock
│   │   └── ...                  # 其他 Mock
│   ├── fixtures/                # 测试数据工厂
│   │   ├── model.ts             # Model 数据
│   │   └── modelProvider.ts     # 供应商数据
│   ├── isolation/               # 环境隔离
│   ├── render/                  # 渲染辅助工具
│   └── integration/             # 集成测试工具
├── fixtures/                    # 全局测试数据
│   ├── chat.ts                  # 聊天数据工厂
│   └── router.ts                # 路由数据
├── components/                  # 组件测试
├── hooks/                       # Hooks 测试
├── services/                    # 服务层测试
├── store/                       # Redux 测试
├── utils/                       # 工具函数测试
├── router/                      # 路由测试
├── pages/                       # 页面测试
├── integration/                 # 集成测试
└── performance/                 # 性能测试
```

## 测试原则与规范

### 核心理念

**测试用户可见行为，而非内部实现细节**。

判断标准：如果重命名函数、移动文件、改变内部实现，测试是否仍然通过？如果答案是否定的，说明测试过度关注实现细节。

### Mock 策略要点

**仅 Mock 系统边界**（网络 API、文件 I/O、第三方服务、时间、浏览器 API），**不 Mock 内部实现**（子组件、Hooks、Redux、工具函数）。

第三方组件库默认不 Mock，仅在渲染耗时、需特殊环境或行为不稳定时 Mock。

### 组件测试

```typescript
// ✅ Mock API 请求，渲染完整组件树，验证用户可见结果
it('应该渲染错误消息 当 API 请求失败', async () => {
  render(<ChatPage />);
  await userEvent.click(screen.getByText('发送'));
  expect(await screen.findByText('网络错误')).toBeInTheDocument();
});

// ❌ Mock 子组件或测试内部方法调用
it('应该调用 handleError 当请求失败', () => {
  const handleErrorSpy = vi.spyOn(component, 'handleError');
  render(<ChatPage />);
  expect(handleErrorSpy).toHaveBeenCalled();
});
```

### Hooks 测试

```typescript
// ✅ 测试 Hook 返回值的行为
it('应该延迟更新值 当输入值变化', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 500 } }
  );
  rerender({ value: 'updated', delay: 500 });
  expect(result.current).toBe('initial');
  act(() => vi.advanceTimersByTime(500));
  expect(result.current).toBe('updated');
  vi.useRealTimers();
});

// ❌ 测试内部函数调用
it('应该在组件卸载时清理定时器', () => {
  const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
  const { unmount } = renderHook(() => useDebounce('value', 500));
  unmount();
  expect(clearTimeoutSpy).toHaveBeenCalled();
});
```

### Redux 测试

```typescript
// ✅ 验证用户可见的最终状态
it('应该加载模型列表 当初始化完成', async () => {
  const store = createTestStore();
  await store.dispatch(fetchModels());
  expect(selectModels(store.getState())).toHaveLength(10);
});

// ❌ 测试中间状态转换
it('应该设置 loading 为 true 当请求开始', () => {
  store.dispatch(fetchModels.pending());
  expect(store.getState().models.loading).toBe(true);
});
```

### Mock 注释规范

所有 Mock 必须说明理由，格式：`// Mock <what> because <reason>`

```typescript
// Mock fetch because network requests are not allowed in tests
global.fetch = vi.fn(() => /* ... */);

// Mock IndexedDB because it's not available in Node.js environment
vi.mock('@/utils/idb', () => ({ /* ... */ }));
```

### 命名规范

测试用例格式："应该 [预期行为] 当 [条件]"，如 "应该渲染错误消息 当 API 请求失败"。

## 类型安全指南

- **为 Mock 对象定义接口**，避免裸 `any`；使用 `mocked()` 工具获取类型安全的 Mock
- **仅允许两种 `any` 场景**：第三方库类型过于复杂、或测试框架无法推断正确类型，且必须注释说明原因
- **示例**：`vi.mocked(streamText).mockReturnValueOnce(mockResult as any)`

## 语义查询规范

### 三层断言模型

测试断言应遵循三层优先级：

1. **ARIA 标准语义**（首选）：`getByRole`、`getByLabelText`、`toHaveAttribute('aria-*')`
2. **data-* 自定义语义**：`data-variant` 传递组件显示变体（如 `compact`/`default`）
3. **删除纯装饰断言**：不替换，直接删除 CSS 类断言

### 查询优先级

```
getByRole > getByLabelText > getByPlaceholderText > getByText > getByTestId
```

### 禁止使用

- **`container.querySelector`**：使用 `screen.getByRole`、`screen.getByTestId` 等替代
- **`container.querySelectorAll`**：使用 `screen.getAllByRole`、`screen.getAllByTestId` 等替代
- **`toHaveClass` 对纯装饰 CSS**：如颜色（`bg-*`）、尺寸（`h-*`、`w-*`）、间距（`p-*`、`m-*`）

### 语义断言示例

```typescript
// ✅ ARIA 属性断言状态
expect(button).toHaveAttribute('aria-current', 'page')
expect(card).toHaveAttribute('aria-expanded', 'true')
expect(skeleton).toHaveAttribute('aria-hidden', 'true')

// ✅ data-variant 断言组件变体
expect(element).toHaveAttribute('data-variant', 'compact')

// ✅ 语义角色查询
screen.getByRole('navigation', { name: '主导航' })
screen.getByRole('heading', { level: 1 })
screen.getByRole('button', { name: /发送/ })

// ❌ CSS 类断言状态
expect(element).toHaveClass('bg-primary/20')
expect(element).toHaveClass('bg-gray-200')

// ❌ container.querySelector
container.querySelector('[data-testid="xxx"]')  // → screen.getByTestId('xxx')
container.querySelector('svg.animate-spin')      // → screen.getByRole('status')
```

### 允许的例外

- **className 透传测试**：验证 `className` prop 正确传递到 DOM
- **边框分隔符**：`toHaveClass('border-r')`、`toHaveClass('border-b')`（网格分隔行为）
- **屏幕阅读器样式**：`toHaveClass('sr-only')`（可访问性相关）
- **第三方组件内部属性**：如 `[data-panel]`（react-resizable-panels 内部属性）

## 测试编写规范

### 测试文件组织

- 核心模块测试（router、Layout、关键工具）放置在 `src/__test__/` 目录
- 组件测试可放置在 `src/__test__/components/` 或组件同目录的 `__tests__` 目录
- 测试数据 fixtures 放置在 `src/__test__/fixtures/` 目录
- 工具函数测试放置在 `src/__test__/utils/` 目录
- 集成测试放置在 `src/__test__/integration/` 目录

### 测试命名规范

- 测试文件命名：`*.test.ts` 或 `*.test.tsx`
- 测试用例命名格式："should [expected behavior] when [condition]"（中文："应该 [预期行为] 当 [条件]"）
- 示例：`should navigate to chat page when chat ID is valid`
- 示例：`应该渲染用户消息当消息角色为 user`

### Mock 使用规范

**单元测试**：Mock 所有外部依赖（API、文件系统、时间）
- 使用 Vitest 的 `vi.fn()` 和 `vi.mock()`
- 示例：`const mockFn = vi.fn(); vi.mock('@/utils/api', () => ({ fetchData: mockFn }));`

**组件测试**：Mock API 请求，避免 Mock 实现细节
- 使用 Vitest 的 `vi.fn()` Mock 函数
- 优先测试用户交互行为，而非内部实现

**集成测试**：仅 Mock 外部服务，保持内部模块真实交互
- Mock 外部 API 请求，使用真实 Redux store 和存储层
- 详细规范：`src/__test__/integration/README.md`

### 测试运行命令

```bash
# 运行测试并监听文件变化
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行所有测试
pnpm test:run
```

## 快速开始

### 导入测试辅助工具

```typescript
// Mock 工厂（从 helpers 导入）
import { createTauriMocks, createStorageMocks } from '@/__test__/helpers/mocks';
import { createMockModel } from '@/__test__/helpers/fixtures';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

// Fixtures（从 fixtures 导入）
import { createMockMessage, createUserMessage, createAssistantMessage } from '@/__test__/fixtures/chat';

// 环境隔离
import { resetTestState } from '@/__test__/helpers/isolation';
```

## Mock 工厂使用指南

### Tauri Mock

```typescript
import { createTauriMocks } from '@/__test__/helpers/mocks/tauri';

describe('测试组件', () => {
  const mocks = createTauriMocks({ isTauri: false });

  beforeEach(() => {
    mocks.windowMock.__TAURI__ = true;
  });

  afterEach(() => {
    mocks.resetAll();
  });
});
```

### Redux Test State

```typescript
import { createModelSliceState } from '@/__test__/helpers/mocks/redux';

const modelState = createModelSliceState({ models: [] });
```

### ChatPanel Mock

```typescript
import { createMockPanelMessage } from '@/__test__/helpers/mocks/chatPanel';

const message = createMockPanelMessage({
  role: 'user',
  content: 'Test message',
});
```

## Vercel AI SDK Mock

> 完整 API 文档见 `src/__test__/helpers/mocks/aiSdk.ts` 中的 JSDoc 注释

### 导入

```typescript
import { createMockStreamResult, createMockAIProvider } from '@/__test__/helpers/mocks/aiSdk';
```

### 依赖注入用法（推荐）

Vitest 的 `vi.mock()` 无法完全拦截 AI SDK 的 HTTP 请求，依赖注入可完全避免此问题：

```typescript
const mockStreamText = vi.fn();
const mockGenerateId = vi.fn(() => 'test-id');

const mockResult = createMockStreamResult([
  { type: 'text-delta', text: 'Hello' },
  { type: 'text-delta', text: ' World' },
]);
mockStreamText.mockReturnValueOnce(mockResult as any);

// 传入依赖注入
for await (const response of streamChatCompletion(params, {
  dependencies: { streamText: mockStreamText, generateId: mockGenerateId }
})) {
  // ...
}
```

### Provider Mock

```typescript
const mockDeepSeek = createMockAIProvider('deepseek');
const model = mockDeepSeek('deepseek-chat');
// { provider: 'deepseek', modelId: 'deepseek-chat', doStream: vi.fn(), ... }
```

### 注意事项

- Mock 对象需 `as any` 类型断言（与真实 SDK 返回类型不完全一致）
- `createMockStreamResult` 返回对象同时是 AsyncIterable 和 Thenable
- 元数据字段（finishReason、usage 等）都是 Promise，会自动 resolve
- Provider mock 详情见 `aiSdk.ts` 中 JSDoc

## Fixtures 使用指南

### Message Fixtures

```typescript
import { createMockMessage, createUserMessage, createAssistantMessage } from '@/__test__/fixtures/chat';

// 创建单条消息
const userMessage = createMockMessage({
  role: 'user',
  content: 'Hello, how are you?',
});

// 创建助手消息（带推理内容）
const assistantMessage = createMockMessage({
  role: 'assistant',
  content: 'I am doing well!',
  reasoningContent: 'Let me think...',
});
```

### Model Fixtures

```typescript
import { createMockModel } from '@/__test__/helpers/fixtures/model';

const model = createMockModel({
  id: 'deepseek-chat',
  nickname: 'DeepSeek Chat',
  providerKey: 'deepseek',
  apiKey: 'sk-test-key',
});
```

### Chat Fixtures

```typescript
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

const chat = createMockChat({
  id: 'chat-1',
  name: 'Test Chat',
  modelIds: ['model-1', 'model-2'],
});
```

## 环境隔离

```typescript
import { resetTestState } from '@/__test__/helpers/isolation';

describe('测试套件', () => {
  afterEach(() => {
    resetTestState();
  });
});
```

## 测试覆盖率

- **追求高覆盖率**，但不要为覆盖率而写测试
- 高覆盖率促使删除无用代码分支
- 发现隐藏 bug 的宝贵机会

**分模块覆盖率阈值**（配置于 `vite.config.ts`，汇总模式）：

| 模块 | 行覆盖率 | 分支覆盖率 |
|------|---------|-----------|
| hooks/ | 85% | 80% |
| services/ | 75% | 70% |
| store/ | 75% | 70% |
| utils/ | 75% | 65% |
| components/ | 65% | 50% |
| config/ | 50% | 50% |
| pages/ | 50% | 40% |
| router/ | 50% | 40% |
| 全局底线 | 65% | 55% |

## 集成测试

集成测试有专门的文档：`src/__test__/integration/README.md`

**集成测试特点**：
- 使用真实 Redux Store
- Mock 外部 API 请求
- 验证端到端业务流程
- 串行执行，避免数据竞争

**运行集成测试**：
```bash
pnpm test:integration
```

## 测试基础设施

### fake-indexeddb 配置

**版本**: `^6.2.5`（2026年3月从 5.0.2 升级）

**配置位置**: `src/__test__/setup.ts`

```typescript
import 'fake-indexeddb/auto';
```

**核心特性**:
- 使用 `DOMException` 错误类型（符合 IndexedDB 规范）
- 二叉搜索树存储，multiEntry 索引插入性能提升 13 倍
- autoIncrement 行为更严格（keyPath 为 undefined 时抛出错误）

**注意事项**:
- 错误类型从 `Error` 改为 `DOMException`，测试断言需相应调整
- 频繁删除/重建 IndexedDB 可能导致超时，建议使用 `beforeAll` 模式
- 需要 `close()` 方法正确关闭数据库连接（`StoreCompat` 接口已添加）

**测试清理最佳实践**:
```typescript
// 避免：频繁使用 beforeEach 删除/重建数据库
// 推荐：使用 beforeAll 进行一次性清理
beforeAll(async () => {
  await closeAllConnections();
  await deleteDatabases();
});

afterAll(async () => {
  await closeAllConnections();
});
```

## 常见问题排查指南

### AI SDK Mock 相关

1. **streamText Mock 不生效** — `vi.mock()` 需在文件顶层静态调用；推荐使用依赖注入方式（见上方 AI SDK 章节）或 `vi.mocked(streamText).mockReturnValueOnce()`

2. **流式响应无法消费** — Mock 结果需同时实现 AsyncIterable 和 Thenable 接口；推荐使用 `createMockStreamResult()` 辅助函数

3. **元数据字段为 undefined** — finishReason、usage 等字段是 Promise，需 `await result` 后再 `.resolve()`

4. **TypeScript 类型错误** — Mock 对象与 SDK 返回类型不完全一致，需 `as any` 类型断言

### 测试环境问题

5. **IndexedDB 不可用** — `setup.ts` 中已导入 `fake-indexeddb/auto`；也可 Mock `storeUtils`

6. **测试之间相互影响** — 确保 `beforeEach` 中 `vi.clearAllMocks()` + `localStorage.clear()`，`afterEach` 中 `resetTestState()`

7. **crypto.subtle 不可用** — `setup.ts` 中已提供 `webcrypto` polyfill

### Mock 配置问题

8. **vi.mock() 中变量访问失败** — `vi.mock()` 是提升的（hoisted），工厂函数内需 `await import('vitest')` 获取 `vi`

9. **测试运行缓慢** — 优先使用全局 Mock、清理定时器、Mock 数据库、拆分大型组件测试

## 相关文档

- [集成测试指南](./integration/README.md)
- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/react)
