# 测试辅助工具文档

本目录提供标准化的 Mock、Fixtures 和测试工具函数。

<!-- Tasks completed: 1.2, 1.3, 1.4, 1.5, 1.6 -->

## 目录结构

```
src/__test__/
├── README.md                    # 本文档
├── setup.ts                     # Vitest 全局设置
├── helpers/                     # 测试辅助工具
│   ├── index.ts                 # 统一导出
│   ├── mocks/                   # Mock 工厂
│   │   ├── tauri.ts            # Tauri API Mock
│   │   ├── crypto.ts           # 加密 Mock
│   │   ├── storage.ts          # 存储 Mock
│   │   ├── redux.ts            # Redux Mock
│   │   ├── fetch.ts            # Fetch API Mock
│   │   ├── router.ts           # Router Mock
│   │   └── chatPanel.ts        # ChatPanel Mock
│   ├── fixtures/               # 测试数据工厂
│   │   ├── model.ts            # Model 数据
│   │   ├── crypto.ts           # 加密数据
│   │   └── modelProvider.ts    # 供应商数据
│   ├── assertions/             # 自定义断言
│   ├── isolation/              # 环境隔离
│   ├── render/                 # 渲染辅助工具
│   └── integration/            # 集成测试工具
├── fixtures/                   # 全局测试数据
│   ├── chat.ts                 # 聊天数据工厂
│   ├── chatPanel.ts            # ChatPanel 数据
│   └── router.ts               # 路由数据
├── components/                 # 组件测试
├── utils/                      # 工具函数测试
└── integration/                # 集成测试
```

## 行为驱动测试原则

> 参考规范：`openspec/changes/improve-unit-testing-practices/specs/behavior-driven-testing/spec.md`

### 核心理念

**测试用户可见行为，而非内部实现细节**。

测试应该模拟真实用户操作（点击、输入、导航），验证用户可见结果（UI 渲染、数据展示），并在重构时保持稳定。

### 判断标准

**如果重命名函数、移动文件、改变内部实现，测试是否仍然通过？**

如果答案是否定的，说明测试过度关注实现细节。

### 组件测试原则

**测试用户交互，而非内部方法调用**

```typescript
// ✅ 测试用户可见行为
it('应该渲染错误消息 当 API 请求失败', async () => {
  render(<ChatPage />);
  await userEvent.click(screen.getByText('发送'));
  expect(await screen.findByText('网络错误')).toBeInTheDocument();
});

// ❌ 测试内部实现
it('应该调用 handleError 当请求失败', () => {
  const handleErrorSpy = vi.spyOn(component, 'handleError');
  render(<ChatPage />);
  // 测试内部方法调用，而非用户可见结果
  expect(handleErrorSpy).toHaveBeenCalled();
});
```

**关键原则**：
- ✅ Mock API 请求（系统边界）
- ❌ 不 Mock 子组件
- ❌ 不测试内部方法调用

### Hooks 测试原则

**测试行为结果，而非内部实现**

```typescript
// ✅ 测试行为：延迟更新值
it('应该延迟更新值 当输入值变化', () => {
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 500 } }
  );
  rerender({ value: 'updated', delay: 500 });
  expect(result.current).toBe('initial'); // 未延迟，值未更新
  act(() => vi.advanceTimersByTime(500));
  expect(result.current).toBe('updated'); // 延迟后，值已更新
});

// ❌ 测试内部实现
it('应该在组件卸载时清理定时器', () => {
  const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
  const { unmount } = renderHook(() => useDebounce('value', 500));
  unmount();
  expect(clearTimeoutSpy).toHaveBeenCalled(); // 测试内部函数调用
});
```

**关键原则**：
- ✅ 测试 Hook 返回值的行为
- ❌ 不测试内部函数调用（如 `clearTimeout` 调用次数）
- ❌ 不测试内部状态管理细节

### Redux 测试原则

**测试完整行为，而非状态转换**

```typescript
// ✅ 测试最终状态（用户可见结果）
it('应该加载模型列表 当初始化完成', async () => {
  const store = createTestStore();
  await store.dispatch(fetchModels());
  expect(selectModels(store.getState())).toHaveLength(10);
});

// ❌ 测试中间状态转换
it('应该设置 loading 为 true 当请求开始', () => {
  const store = createTestStore();
  store.dispatch(fetchModels.pending());
  expect(store.getState().models.loading).toBe(true);
});
```

**关键原则**：
- ✅ 验证用户可见的最终状态
- ❌ 不测试中间状态转换（如 `pending` → `fulfilled`）
- ✅ 更多依赖集成测试验证 Redux 行为

### 测试命名规范

**格式**："应该 [预期行为] 当 [条件]"

**示例**：
- 组件测试："应该渲染错误消息 当 API 请求失败"
- Hooks 测试："应该延迟更新值 当输入值变化"
- 集成测试："应该完成完整聊天流程 当用户发送消息"

## 测试隔离和 Mock 策略

> 参考规范：`openspec/changes/improve-unit-testing-practices/specs/test-isolation-guidelines/spec.md`

### 核心原则

**仅 Mock 系统边界，不 Mock 内部实现**

### 什么是系统边界（应该 Mock）

系统边界是指代码与外部世界交互的接口：

1. **网络 API 调用**：fetch、axios、XMLHttpRequest
2. **文件系统 I/O**：fs、IndexedDB、localStorage
3. **第三方服务**：Stripe、OpenAI API、支付网关
4. **时间相关**：Date、setTimeout、setInterval（仅在必要时）
5. **随机数生成**：Math.random
6. **浏览器 API**：Geolocation、MediaDevices

**示例**：
```typescript
// ✅ Mock HTTP 请求（系统边界）
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([{ id: 1, name: 'Alice' }]),
  })
);
```

### 什么是内部实现（不应该 Mock）

内部实现是指代码内部的逻辑和组件：

1. **React 组件**：子组件、Hooks
2. **Redux**：store、selectors、actions
3. **工具函数**：辅助函数、内部模块
4. **内部依赖**：项目内部模块

**错误示例**：
```typescript
// ❌ Mock 内部 Hook
vi.spyOn(userHook, 'useUsers').mockReturnValue({
  users: [{ id: 1, name: 'Alice' }]
});

// ❌ Mock 子组件
vi.mock('@/components/ChatButton', () => ({
  default: () => <button>Mock Button</button>
}));
```

### 组件测试的 Mock 策略

```typescript
// ✅ 正确：Mock API 请求，渲染完整组件树
describe('ChatPage', () => {
  beforeEach(() => {
    // Mock 系统边界（API 请求）
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ models: [] }),
      })
    );
  });

  it('应该显示模型列表', () => {
    render(<ChatPage />); // 渲染完整组件树
    expect(screen.getByText('选择模型')).toBeInTheDocument();
  });
});

// ❌ 错误：Mock 子组件
vi.mock('@/components/ChatButton', () => ({
  default: () => <button>Mock</button>
}));
```

### Hooks 测试的 Mock 策略

```typescript
// ✅ 正确：使用 Fake Timers 测试行为
it('应该延迟更新值', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 500 } }
  );
  rerender({ value: 'updated', delay: 500 });
  vi.advanceTimersByTime(500);
  expect(result.current).toBe('updated');
  vi.useRealTimers();
});

// ❌ 错误：测试内部函数调用
it('应该清理定时器', () => {
  const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
  const { unmount } = renderHook(() => useDebounce('value', 500));
  unmount();
  expect(clearTimeoutSpy).toHaveBeenCalled();
});
```

### 服务层测试的 Mock 策略

```typescript
// ✅ 正确：Mock API 调用，测试完整服务行为
describe('chatService', () => {
  it('应该流式返回消息', async () => {
    // Mock 系统边界（Vercel AI SDK）
    vi.mock('@ai-sdk/vite', () => ({
      streamText: vi.fn(() => createMockStream())
    }));

    const response = await streamChatCompletion(messages);
    expect(response).toBeDefined();
  });
});

// ❌ 错误：Mock 内部工具函数
vi.mock('@/utils/messageTransform', () => ({
  transformMessage: vi.fn(() => ({ /* mock */ }))
}));
```

### 第三方组件库 Mock 策略

**默认不 Mock，仅在必要时 Mock**

**Mock 条件**（满足任一即可）：
- 组件渲染耗时（如复杂的可视化组件）
- 组件需要特殊环境（如 WebAssembly）
- 组件行为不稳定（如 beta 版本）

**示例**：
```typescript
// ✅ 优先测试完整行为
import { Chart } from 'chart.js';

it('应该渲染图表', () => {
  render(<Chart data={mockData} />);
  expect(screen.getByTestId('chart-container')).toBeInTheDocument();
});

// 仅在必要时 Mock，并添加注释
// Mock Chart.js due to performance issues in test environment
vi.mock('chart.js', () => ({
  default: () => <div data-testid="mock-chart" />
}));
```

### 集成测试的 Mock 策略

**使用真实实现，仅 Mock 外部服务**

```typescript
// ✅ 使用真实 Redux store 和存储层
describe('聊天流程集成测试', () => {
  beforeEach(() => {
    // 仅 Mock 远程 API
    setupMockHandlers([
      rest.post('/api/chat', (req, res, ctx) => {
        return res(ctx.json({ message: 'Hello' }));
      }),
    ]);
  });

  it('应该完成完整聊天流程', async () => {
    const store = createTestStore(); // 真实 Redux store
    render(<App store={store} />); // 完整组件树
    
    await userEvent.type(screen.getByRole('textbox'), 'Hello');
    await userEvent.click(screen.getByText('发送'));
    
    expect(await screen.findByText('Hello')).toBeInTheDocument();
  });
});
```

### Mock 注释规范

**所有 Mock 必须有清晰的理由**

```typescript
// 格式：// Mock <what> because <reason>

// Mock fetch because network requests are not allowed in tests
global.fetch = vi.fn(() => /* ... */);

// Mock IndexedDB because it's not available in Node.js environment
vi.mock('@/utils/idb', () => ({ /* ... */ }));
```

## 测试目录结构重组说明

### 重组原因

**从"按文件结构组织"改为"按功能/行为组织"**

旧结构的问题：
- 机械照搬 `src/` 目录（`components/`、`hooks/`、`store/`）
- 导致测试关注"每个函数是否被测试"，而非"每个行为是否被测试"
- 难以找到完整功能的测试

新结构的优势：
- ✅ 测试聚焦于"验证功能"，而非"覆盖文件"
- ✅ 易于找到相关测试（如"聊天管理"功能的所有测试在一个文件）
- ✅ 促进编写集成测试（自然地测试完整功能）

### 新旧目录结构对比

**旧结构**（按文件组织）：
```
src/__test__/
├── components/          # 所有组件测试
│   ├── ChatPage.test.tsx
│   ├── ChatSidebar.test.tsx
│   └── ModelTable.test.tsx
├── hooks/              # 所有 Hooks 测试
│   └── useDebounce.test.ts
├── store/              # Redux 测试
│   └── modelSlice.test.ts
└── utils/              # 工具函数测试
    └── crypto.test.ts
```

**新结构**（按功能组织）：
```
src/__test__/
├── e2e/                          # 端到端测试
│   ├── chat-flow.test.ts         # 完整聊天流程
│   ├── model-management.test.ts  # 模型管理流程
│   └── settings-change.test.ts   # 设置变更流程
├── components/                   # 保留：简单组件测试
│   └── Button.test.tsx
├── hooks/                        # 保留：独立 Hooks 测试
│   └── useDebounce.test.ts
├── services/                     # 保留：服务层测试
│   └── chatService.test.ts
└── helpers/                      # 测试辅助工具（不变）
```

### 哪些测试保留按文件组织

**适合保留按文件组织的情况**：

1. **简单组件**：如 `Button`、`Input`、`Badge`
2. **独立工具函数**：如 `formatDate`、`generateId`
3. **独立 Hooks**：如 `useDebounce`、`useToggle`

**适合按功能组织的情况**：

1. **复杂页面**：如 `ChatPage` → `chat-management.test.ts`
2. **用户流程**：如"创建聊天 → 发送消息 → 删除聊天"
3. **功能模块**：如"模型管理"、"设置管理"

### 功能测试文件命名规范

**格式**：`<功能名>.test.ts` 或 `<功能名>.integration.test.ts`

**示例**：
- `chat-management.test.ts` - 聊天管理功能
- `model-management.test.ts` - 模型管理功能
- `settings-change.integration.test.ts` - 设置变更集成测试

## Before/After 对比示例

### 示例 1：useDebounce Hook 测试

**Before：测试实现细节**

```typescript
// ❌ 测试内部函数调用
it('应该在组件卸载时清理定时器', () => {
  const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
  const { unmount } = renderHook(() => useDebounce('value', 500));
  unmount();
  expect(clearTimeoutSpy).toHaveBeenCalled();
});

it('应该在延迟时间内不设置新定时器', () => {
  const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
  const { rerender } = renderHook(
    ({ value }) => useDebounce(value, 500),
    { initialProps: { value: 'initial' } }
  );
  
  rerender({ value: 'updated1' });
  rerender({ value: 'updated2' });
  
  expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
});
```

**After：测试行为**

```typescript
// ✅ 测试用户可见行为
it('应该延迟更新值 当输入值变化', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 500 } }
  );
  
  rerender({ value: 'updated', delay: 500 });
  expect(result.current).toBe('initial'); // 未延迟，值未更新
  
  act(() => vi.advanceTimersByTime(500));
  expect(result.current).toBe('updated'); // 延迟后，值已更新
  
  vi.useRealTimers();
});
```

**改进优势**：
- ✅ 测试关注"做什么"，而非"怎么做"
- ✅ 重构友好（改变内部实现不影响测试）
- ✅ 测试更有价值（验证实际用户行为）

### 示例 2：ChatPage 组件测试

**Before：Mock 子组件**

```typescript
// ❌ Mock 子组件
vi.mock('@/components/ChatButton', () => ({
  default: () => <button>Mock Button</button>
}));

vi.mock('@/components/ChatBubble', () => ({
  default: () => <div>Mock Bubble</div>
}));

it('应该渲染聊天页面', () => {
  render(<ChatPage />);
  expect(screen.getByText('Mock Button')).toBeInTheDocument();
});
```

**After：测试完整组件树**

```typescript
// ✅ 渲染完整组件树
it('应该显示聊天界面 当页面加载', () => {
  const store = createTestStore({
    preloadedState: {
      chat: {
        selectedChatId: 'chat-1',
        chatList: [{ id: 'chat-1', name: '测试聊天' }],
      },
    },
  });
  
  render(<ChatPage />, { wrapper: ({ children }) => (
    <Provider store={store}>{children}</Provider>
  )});
  
  expect(screen.getByText('测试聊天')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('输入消息')).toBeInTheDocument();
});
```

**改进优势**：
- ✅ 测试真实用户行为（渲染完整 UI）
- ✅ 重构友好（重命名、移动组件不会导致测试失败）
- ✅ 捕获集成问题（组件间交互错误）

### 示例 3：Redux 测试

**Before：测试状态转换**

```typescript
// ❌ 测试中间状态转换
it('应该设置 loading 为 true 当请求开始', () => {
  const state = modelSlice.reducer(
    initialState,
    fetchModels.pending('', {})
  );
  expect(state.loading).toBe(true);
});

it('应该设置 loading 为 false 当请求成功', () => {
  const state = modelSlice.reducer(
    { ...initialState, loading: true },
    fetchModels.fulfilled({ models: [] }, '')
  );
  expect(state.loading).toBe(false);
});
```

**After：测试最终状态**

```typescript
// ✅ 测试用户可见的最终状态
it('应该加载模型列表 当初始化完成', async () => {
  const store = createTestStore();
  
  await store.dispatch(fetchModels());
  
  const models = selectModels(store.getState());
  expect(models).toHaveLength(10);
  expect(models[0].nickname).toBe('GPT-4');
});
```

**改进优势**：
- ✅ 测试用户可见结果
- ✅ 减少重复测试（集成测试会验证 Redux + UI）
- ✅ 更关注端到端行为

## 常见反模式和解决方案

### 反模式 1：过度 Mock 子组件

**问题**：
```typescript
// ❌ Mock 子组件
vi.mock('@/components/ChatButton', () => ({
  default: () => <button>Mock</button>
}));

render(<ChatPage />);
expect(screen.getByText('Mock')).toBeInTheDocument();
```

**影响**：
- 测试不验证真实渲染结果
- 组件交互错误无法被发现
- 重构时容易失败

**解决方案**：
```typescript
// ✅ 渲染完整组件树
render(<ChatPage />);
expect(screen.getByRole('button', { name: '发送' })).toBeInTheDocument();
```

### 反模式 2：测试内部函数调用

**问题**：
```typescript
// ❌ 测试内部函数调用
it('应该调用 validateEmail', () => {
  const validateSpy = vi.spyOn(utils, 'validateEmail');
  render(<LoginForm email="test@example.com" />);
  expect(validateSpy).toHaveBeenCalledWith('test@example.com');
});
```

**影响**：
- 测试与实现细节强耦合
- 重命名、移动函数导致测试失败
- 无法验证实际用户行为

**解决方案**：
```typescript
// ✅ 测试用户可见行为
it('应该显示错误提示 当邮箱格式无效', async () => {
  render(<LoginForm />);
  await userEvent.type(screen.getByLabelText('邮箱'), 'invalid-email');
  await userEvent.click(screen.getByText('登录'));
  expect(screen.getByText('邮箱格式不正确')).toBeInTheDocument();
});
```

### 反模式 3：测试 Redux 中间状态

**问题**：
```typescript
// ❌ 测试中间状态转换
it('应该设置 loading 为 true', () => {
  const state = reducer(initialState, fetchModels.pending());
  expect(state.loading).toBe(true);
});
```

**影响**：
- 测试用户不关心的实现细节
- 与集成测试重复
- 维护成本高

**解决方案**：
```typescript
// ✅ 测试最终状态或使用集成测试
it('应该加载模型数据', async () => {
  const store = createTestStore();
  await store.dispatch(fetchModels());
  expect(selectModels(store.getState())).toHaveLength(10);
});
```

### 反模式 4：断言 Mock 函数调用次数

**问题**：
```typescript
// ❌ 断言内部调用次数
it('应该调用一次 setTimeout', () => {
  const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
  useDebounce('value', 500);
  expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
});
```

**影响**：
- 测试实现细节
- 重构时容易失败
- 不验证实际行为

**解决方案**：
```typescript
// ✅ 验证行为结果
it('应该延迟更新值', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 500),
    { initialProps: { value: 'initial' } }
  );
  rerender({ value: 'updated' });
  vi.advanceTimersByTime(500);
  expect(result.current).toBe('updated');
  vi.useRealTimers();
});
```

### 反模式 5：机械照搬源代码结构

**问题**：
```typescript
// ❌ 测试目录结构完全照搬 src/
src/__test__/
├── components/
│   ├── ChatPage.test.tsx
│   ├── ChatSidebar.test.tsx
│   └── ...
├── hooks/
│   ├── useDebounce.test.ts
│   └── ...
└── store/
    └── slices/
        └── modelSlice.test.ts
```

**影响**：
- 测试关注"覆盖文件"，而非"验证功能"
- 难以找到完整功能的测试
- 不利于集成测试

**解决方案**：
```typescript
// ✅ 按功能组织测试
src/__test__/
├── e2e/
│   ├── chat-management.test.ts
│   ├── model-management.test.ts
│   └── settings-change.test.ts
├── components/
│   └── Button.test.tsx  # 简单组件保留
└── services/
    └── chatService.test.ts
```

### 反模式 6：Mock 没有清晰理由

**问题**：
```typescript
// ❌ Mock 没有注释说明理由
vi.mock('@/utils/formatDate', () => ({
  formatDate: vi.fn(() => '2024-01-01')
}));
```

**影响**：
- 难以判断 Mock 是否必要
- 维护困难
- 可能隐藏问题

**解决方案**：
```typescript
// ✅ Mock 时添加注释说明理由
// Mock formatDate because it relies on current date and causes test flakiness
vi.mock('@/utils/formatDate', () => ({
  formatDate: vi.fn(() => '2024-01-01')
}));
```

### 反模式 7：测试名称不清晰

**问题**：
```typescript
// ❌ 测试名称不描述行为
it('test debounce hook', () => {
  // ...
});

it('should work', () => {
  // ...
});
```

**影响**：
- 测试失败时难以理解问题
- 文档价值低
- 不易维护

**解决方案**：
```typescript
// ✅ 使用规范命名格式
it('应该延迟更新值 当输入值变化', () => {
  // ...
});

it('应该显示错误提示 当 API 请求失败', () => {
  // ...
});
```

---

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
- 使用 MSW Mock API 请求
- 使用真实 Redux store 和存储层
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
import { createTauriMocks, createCryptoMocks, createStorageMocks } from '@/__test__/helpers/mocks';
import { createMockModel } from '@/__test__/helpers/fixtures';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

// Fixtures（从 fixtures 导入）
import { createMockMessage, createMockMessages } from '@/__test__/fixtures/chat';

// 自定义断言
import { toBeEncrypted, toBeValidMasterKey } from '@/__test__/helpers/assertions';

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

### Redux Mock

```typescript
import { createMockStore } from '@/__test__/helpers/mocks/redux';

const mockStore = createMockStore({
  preloadedState: {
    chat: { chatList: [], selectedChatId: null },
  },
});
```

### ChatPanel Mock

```typescript
import { createMockPanelMessage } from '@/__test__/helpers/mocks/chatPanel';

const message = createMockPanelMessage({
  role: 'user',
  content: 'Test message',
});
```

## Fixtures 使用指南

### Message Fixtures

```typescript
import { createMockMessage, createMockMessages } from '@/__test__/fixtures/chat';

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

// 批量创建消息
const messages = createMockMessages(5, {
  role: 'user',
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

## 自定义断言

```typescript
import { toBeEncrypted, toBeValidMasterKey } from '@/__test__/helpers/assertions';

// 断言值是加密格式
expect(encryptedValue).toBeEncrypted();

// 断言值是有效的主密钥
expect(masterKey).toBeValidMasterKey();
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

## 性能测试工具

```typescript
import { measurePerformance, expectDuration } from '@/__test__/helpers/isolation/performance';

// 测量执行时间
const { result, duration } = await measurePerformance(async () => {
  return await someAsyncOperation();
});

// 期望执行时间在阈值内
await expectDuration(async () => {
  await someOperation();
}, 1000); // 1 秒内完成
```

## 组件测试示例

### 基础组件测试

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChatPanelHeader from '@/components/ChatPanelHeader';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createTestStore = () => configureStore({
  reducer: {
    chat: chatReducer,
    chatPage: chatPageReducer,
  },
  preloadedState: {
    chat: {
      chatList: [{
        id: 'test-chat-1',
        name: 'Test Chat',
        chatModelList: [],
        isDeleted: false,
      }],
      selectedChatId: 'test-chat-1',
    },
  },
});

describe('ChatPanelHeader', () => {
  it('应该显示聊天名称', () => {
    const store = createTestStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    render(<ChatPanelHeader columnCount={2} setColumnCount={vi.fn()} />, { wrapper });

    expect(screen.getByText(/Test Chat/i)).toBeInTheDocument();
  });
});
```

### 使用 Mock 数据

```typescript
import { createMockChat, createMockModel } from '@/__test__/helpers';
import { createMockStore } from '@/__test__/helpers/mocks/redux';

describe('ModelSelect', () => {
  it('应该显示模型列表', () => {
    const mockModels = [
      createMockModel({ id: 'model-1', nickname: 'GPT-4' }),
      createMockModel({ id: 'model-2', nickname: 'Claude 3' }),
    ];

    const mockStore = createMockStore({
      preloadedState: {
        models: { models: mockModels },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>{children}</Provider>
    );

    render(<ModelSelect />, { wrapper });

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Claude 3')).toBeInTheDocument();
  });
});
```

## 测试最佳实践

### 核心原则

#### 1. 测试行为，而不是实现细节

**不要简单地在 tests/ 目录照搬 src/ 目录结构**。测试应该关注对外暴露的接口和行为，而非内部实现。

**判断标准**：如果我重构内部逻辑，测试代码是否可以完全不改？如果答案是否定的，说明测试的是实现细节。

```typescript
// ❌ 测试内部函数
import * as cart from './cart';

it('should apply a 10% discount', () => {
  expect(cart.applyDiscount(110)).toBe(99);
});

// ✅ 测试对外行为
it('should calculate total with discount for high value carts', () => {
  const items = [{ price: 50 }, { price: 60 }];
  expect(cart.calculateTotal(items)).toBe(99);
});
```

#### 2. Mock 系统边界，而不是内部实现

**只 mock API（网络请求）和第三方服务**，通过 UI 操作测试行为。避免 mock 内部技术层。

**系统边界包括**：
- HTTP 请求
- 第三方服务（如 Stripe 支付）
- 时间相关逻辑
- 随机数生成
- 文件读写等 I/O 操作

```typescript
// ❌ Mock 内部 Hook
jest.spyOn(userHook, 'useUsers').mockReturnValue({
  users: [{ id: 1, name: 'Alice' }]
});

// ✅ Mock HTTP 请求（系统边界）
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([{ id: 1, name: 'Alice' }]),
  })
);
```

#### 3. 务实优先：使用内存数据库

**对于后端测试**，使用内存数据库（如 MongoDB Memory Server）而不是 mock 数据库客户端。

**好处**：
- 运行高效（几毫秒内跑完上千条测试）
- 稳定可靠（无网络延迟、丢包）
- 更高测试信心（验证真实数据库行为）

#### 4. 正确进行 HTTP Mock

**使用录制工具**（如 Nock、VCR）记录真实 HTTP 请求作为 fixtures。

**好处**：
- 测试不受第三方库 API 变化影响
- 真实的请求/响应数据
- 更容易升级依赖

#### 5. 终极检验标准

**你敢在周五傍晚发布吗？** 如果测试体系能让你在周五下午 5 点安心上线，那就是真正有价值的测试。

---

### 编写规范

#### 1. 始终重置 Mock

```typescript
afterEach(() => {
  vi.clearAllMocks();
  resetTestState();
});
```

#### 2. 使用语义化的测试数据

```typescript
// ✅ 好的做法
const model = createMockModel({ nickname: 'DeepSeek Chat' });

// ❌ 不好的做法
const model = { id: '...', nickname: '...', /* ... */ };
```

#### 3. 保持测试独立

```typescript
describe('功能测试', () => {
  afterEach(() => {
    resetTestState(); // 确保每个测试独立
  });

  it('测试 1', () => { /* ... */ });
  it('测试 2', () => { /* ... */ });
});
```

#### 4. 使用辅助工具简化测试

```typescript
// ✅ 使用 Mock 工厂
const message = createMockPanelMessage({ role: 'user' });

// ❌ 手动构建对象
const message = {
  id: 'msg-1',
  role: 'user',
  content: '...',
  timestamp: Date.now(),
  // ...
};
```

### 测试覆盖率

- **追求高覆盖率**，但不要为覆盖率而写测试
- 高覆盖率促使删除无用代码分支
- 发现隐藏 bug 的宝贵机会

## 集成测试

集成测试有专门的文档：`src/__test__/integration/README.md`

**集成测试特点**：
- 使用真实 Redux Store
- 使用 MSW Mock API 请求
- 验证端到端业务流程
- 串行执行，避免数据竞争

**运行集成测试**：
```bash
pnpm test:integration
```

## 相关文档

- [集成测试指南](./integration/README.md)
- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/react)
