# 行为驱动测试指南 (BDD Guide)

## 什么是行为驱动测试？

行为驱动测试（Behavior-Driven Development, BDD）是一种测试方法论，**测试用户可见行为，而非内部实现细节**。

### 核心理念

**测试应该模拟真实用户操作（点击、输入、导航），验证用户可见结果（UI 渲染、数据展示），并在重构时保持稳定。**

### 为什么重要？

| 优势 | 说明 |
|------|------|
| **重构友好** | 改变内部实现不会导致测试失败 |
| **更有价值** | 验证实际用户行为，而非代码细节 |
| **易于维护** | 测试意图清晰，易于理解和修改 |
| **减少脆性** | 不会因重命名、移动文件导致测试失败 |

## 判断标准

### 核心问题

**如果我重构内部逻辑，测试代码是否可以完全不改？**

如果答案是否定的，说明测试过度关注实现细节。

### 示例判断

```typescript
// ❌ 测试实现细节
it('应该调用 handleError 当请求失败', () => {
  const handleErrorSpy = vi.spyOn(component, 'handleError');
  // 测试内部方法调用，而非用户可见结果
  expect(handleErrorSpy).toHaveBeenCalled();
});
// 判断：重命名 handleError 函数会导致测试失败 → 测试实现细节

// ✅ 测试用户可见行为
it('应该显示错误提示 当 API 请求失败', async () => {
  render(<ChatPage />);
  await userEvent.click(screen.getByText('发送'));
  expect(await screen.findByText('网络错误')).toBeInTheDocument();
});
// 判断：重构内部逻辑不影响测试 → 测试用户行为
```

## 测试命名规范

### 格式

**中文**："应该 [预期行为] 当 [条件]"
**英文**："should [expected behavior] when [condition]"

### 命名原则

1. **以"应该"开头**（中文）或 "should" 开头（英文）
2. **描述用户可见结果**，而非内部函数调用
3. **使用"当"子句**（中文）或 "when" 子句（英文）描述触发条件

### 示例

| 测试类型 | 好的命名 | 不好的命名 |
|---------|---------|-----------|
| 组件测试 | 应该显示错误提示 当 API 请求失败 | 应该调用 handleError |
| Hooks 测试 | 应该延迟更新值 当输入值变化 | 应该设置定时器 |
| Redux 测试 | 应该加载模型列表 当初始化完成 | 应该设置 loading 为 true |
| 集成测试 | 应该完成完整聊天流程 当用户发送消息 | 应该 dispatch fetchMessages |

## 如何识别测试内部实现

### 检查清单

**如果你的测试包含以下内容，很可能在测试内部实现**：

- [ ] 测试内部方法调用（如 `expect(handleError).toHaveBeenCalled()`）
- [ ] Mock 子组件（如 `vi.mock('@/components/Button')`）
- [ ] 测试中间状态转换（如 Redux `pending` → `fulfilled`）
- [ ] 断言内部函数调用次数（如 `expect(setTimeout).toHaveBeenCalledTimes(1)`）
- [ ] 测试私有方法或内部变量
- [ ] 使用 `vi.spyOn` 监听内部模块

### 示例对比

#### 示例 1：组件测试

```typescript
// ❌ 测试内部实现
vi.mock('@/components/ChatButton', () => ({
  default: () => <button>Mock Button</button>
}));

it('应该渲染聊天页面', () => {
  render(<ChatPage />);
  expect(screen.getByText('Mock Button')).toBeInTheDocument();
});
// 问题：Mock 子组件，测试假数据

// ✅ 测试用户可见行为
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
// 优势：测试真实 UI，验证用户可见结果
```

#### 示例 2：Hooks 测试

```typescript
// ❌ 测试内部实现
it('应该在组件卸载时清理定时器', () => {
  const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
  const { unmount } = renderHook(() => useDebounce('value', 500));
  unmount();
  expect(clearTimeoutSpy).toHaveBeenCalled();
});
// 问题：测试内部函数调用

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
// 优势：测试行为结果（延迟更新值）
```

#### 示例 3：Redux 测试

```typescript
// ❌ 测试内部实现
it('应该设置 loading 为 true 当请求开始', () => {
  const state = modelSlice.reducer(
    initialState,
    fetchModels.pending('', {})
  );
  expect(state.loading).toBe(true);
});
// 问题：测试中间状态转换（用户不关心）

// ✅ 测试用户可见行为
it('应该加载模型列表 当初始化完成', async () => {
  const store = createTestStore();

  await store.dispatch(fetchModels());

  const models = selectModels(store.getState());
  expect(models).toHaveLength(10);
  expect(models[0].nickname).toBe('GPT-4');
});
// 优势：测试最终状态（用户可见结果）
```

## 如何编写行为测试

### 步骤 1：识别用户行为

**问自己：用户会看到什么？做什么？**

```typescript
// 用户视角：
// 1. 点击"发送"按钮
// 2. 看到加载指示器
// 3. 看到助手回复

// 测试：
it('应该显示助手回复 当用户发送消息', async () => {
  render(<ChatPage />);

  // 1. 用户点击发送
  await userEvent.click(screen.getByText('发送'));

  // 2. 验证加载状态（用户可见）
  expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

  // 3. 验证助手回复（用户可见）
  expect(await screen.findByText('你好！')).toBeInTheDocument();
});
```

### 步骤 2：Mock 系统边界

**只 Mock 系统边界（API、文件系统），不 Mock 内部实现**

```typescript
// ✅ Mock API 请求（系统边界）
beforeEach(() => {
  server.use(deepSeekHandlers.success());
});

// ❌ 不 Mock 内部 Hook
// vi.mock('@/hooks/useChat', () => ({ /* ... */ }));
```

### 步骤 3：使用用户交互

**使用 `@testing-library/user-event` 模拟真实用户操作**

```typescript
import { userEvent } from '@testing-library/user-event';

it('应该显示错误提示 当邮箱格式无效', async () => {
  render(<LoginForm />);

  // 模拟用户输入
  await userEvent.type(screen.getByLabelText('邮箱'), 'invalid-email');
  await userEvent.click(screen.getByText('登录'));

  // 验证用户可见结果
  expect(screen.getByText('邮箱格式不正确')).toBeInTheDocument();
});
```

### 步骤 4：验证用户可见结果

**断言 UI 渲染、数据展示、用户反馈**

```typescript
// ✅ 验证 UI 渲染
expect(screen.getByText('测试聊天')).toBeInTheDocument();

// ✅ 验证数据展示
expect(screen.getAllByRole('listitem')).toHaveLength(10);

// ✅ 验证用户反馈
expect(await screen.findByText('保存成功')).toBeInTheDocument();
```

## 组件测试最佳实践

### 原则 1：测试用户交互

```typescript
// ✅ 测试用户交互
it('应该删除聊天 当用户点击删除按钮', async () => {
  const store = createTestStore({
    preloadedState: {
      chat: {
        chatList: [{ id: 'chat-1', name: '测试聊天' }],
        selectedChatId: 'chat-1',
      },
    },
  });

  render(<ChatSidebar />, { wrapper: ({ children }) => (
    <Provider store={store}>{children}</Provider>
  )});

  // 用户点击删除
  await userEvent.click(screen.getByText('删除'));

  // 验证结果
  expect(screen.queryByText('测试聊天')).not.toBeInTheDocument();
});
```

### 原则 2：渲染完整组件树

```typescript
// ✅ 渲染完整组件树
render(<ChatPage />);

// ❌ Mock 子组件
vi.mock('@/components/ChatButton', () => ({
  default: () => <button>Mock</button>
}));
```

### 原则 3：使用描述性断言

```typescript
// ✅ 使用描述性断言
expect(screen.getByRole('button', { name: '发送' })).toBeInTheDocument();

// ❌ 使用模糊断言
expect(container.querySelector('.btn-primary')).toBeTruthy();
```

## Hooks 测试最佳实践

### 原则 1：测试行为结果

```typescript
// ✅ 测试行为结果（返回值）
it('应该延迟更新值 当输入值变化', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 500 } }
  );

  rerender({ value: 'updated', delay: 500 });
  expect(result.current).toBe('initial'); // 行为：未延迟，值未更新

  act(() => vi.advanceTimersByTime(500));
  expect(result.current).toBe('updated'); // 行为：延迟后，值已更新
});

// ❌ 测试内部实现
it('应该清理定时器 当组件卸载', () => {
  const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
  const { unmount } = renderHook(() => useDebounce('value', 500));
  unmount();
  expect(clearTimeoutSpy).toHaveBeenCalled();
});
```

### 原则 2：测试边界条件

```typescript
// ✅ 测试边界条件（用户可见）
it('应该返回空值 当延迟为 0', () => {
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 0 } }
  );

  rerender({ value: 'updated', delay: 0 });
  expect(result.current).toBe('updated'); // 立即更新（无延迟）
});
```

## Redux 测试最佳实践

### 原则 1：测试最终状态

```typescript
// ✅ 测试最终状态（用户可见结果）
it('应该加载模型列表 当初始化完成', async () => {
  const store = createTestStore();

  await store.dispatch(fetchModels());

  const models = selectModels(store.getState());
  expect(models).toHaveLength(10);
  expect(models[0].nickname).toBe('GPT-4');
});

// ❌ 测试中间状态转换
it('应该设置 loading 为 true 当请求开始', () => {
  const state = modelSlice.reducer(
    initialState,
    fetchModels.pending('', {})
  );
  expect(state.loading).toBe(true);
});
```

### 原则 2：使用集成测试补偿

```typescript
// Redux 单元测试：测试核心逻辑
it('应该添加模型到列表 当调用 addModel', () => {
  const newModel = createMockModel({ nickname: 'GPT-4' });
  const state = modelSlice.reducer(undefined, {
    type: 'models/addModel',
    payload: newModel,
  });

  expect(state.models).toContainEqual(newModel);
});

// 集成测试：测试完整流程（包括 UI）
it('应该显示加载指示器 当加载模型', async () => {
  render(<ModelTable />);

  // 验证 UI 更新
  expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

  // 等待加载完成
  await waitFor(() => {
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });
});
```

## 常见反模式

### 反模式 1：过度 Mock 子组件

**问题**：测试不验证真实渲染结果

```typescript
// ❌ Mock 子组件
vi.mock('@/components/ChatButton', () => ({
  default: () => <button>Mock</button>
}));

render(<ChatPage />);
expect(screen.getByText('Mock')).toBeInTheDocument();
```

**解决方案**：渲染完整组件树

```typescript
// ✅ 渲染完整组件树
render(<ChatPage />);
expect(screen.getByRole('button', { name: '发送' })).toBeInTheDocument();
```

### 反模式 2：测试内部函数调用

**问题**：测试与实现细节强耦合

```typescript
// ❌ 测试内部函数调用
it('应该调用 validateEmail', () => {
  const validateSpy = vi.spyOn(utils, 'validateEmail');
  render(<LoginForm email="test@example.com" />);
  expect(validateSpy).toHaveBeenCalledWith('test@example.com');
});
```

**解决方案**：测试用户可见行为

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

**问题**：测试用户不关心的实现细节

```typescript
// ❌ 测试中间状态转换
it('应该设置 loading 为 true', () => {
  const state = reducer(initialState, fetchModels.pending());
  expect(state.loading).toBe(true);
});
```

**解决方案**：测试最终状态或使用集成测试

```typescript
// ✅ 测试最终状态
it('应该加载模型数据', async () => {
  const store = createTestStore();
  await store.dispatch(fetchModels());
  expect(selectModels(store.getState())).toHaveLength(10);
});
```

## 重构友好性验证

### 验证方法

**重构一个组件内部实现，运行相关测试，确认测试仍通过（无需修改）**

### 示例验证

```typescript
// Before: 使用 useState
function ChatPage() {
  const [messages, setMessages] = useState([]);
  // ...
}

// After: 使用 useReducer（重构）
function ChatPage() {
  const [state, dispatch] = useReducer(chatReducer, { messages: [] });
  // ...
}

// 测试应该仍然通过（无需修改）
it('应该显示消息列表', () => {
  render(<ChatPage />);
  expect(screen.getAllByRole('listitem')).toHaveLength(10);
});
```

## 检查清单

编写测试时，使用以下检查清单：

- [ ] 测试名称描述用户可见行为（而非内部函数）
- [ ] Mock 系统边界（API、文件系统），不 Mock 内部实现
- [ ] 使用用户交互（userEvent）模拟真实操作
- [ ] 验证用户可见结果（UI 渲染、数据展示）
- [ ] 不测试中间状态转换（如 Redux pending）
- [ ] 不断言内部函数调用（如 expect(handleError).toHaveBeenCalled()）
- [ ] 不 Mock 子组件
- [ ] 测试在重构后仍通过（无需修改）

## 相关文档

- [测试辅助工具文档](../README.md)
- [集成测试指南](../integration/README.md)
- [React Testing Library 最佳实践](https://testing-library.com/docs/react-testing-library/intro/)
- [Kent C. Dodds: Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
