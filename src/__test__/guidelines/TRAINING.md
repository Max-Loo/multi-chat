# 测试质量重构 - 团队培训材料

## 培训目标

本次培训旨在帮助团队成员：

1. 理解新的测试标准和最佳实践
2. 掌握 MSW、Fixtures、类型安全等工具的使用
3. 编写高质量、可维护的测试代码

## 培训大纲

### 模块 1：MSW Handlers 使用（30 分钟）
### 模块 2：类型安全最佳实践（30 分钟）
### 模块 3：Fixtures 使用（15 分钟）
### 模块 4：行为驱动测试（30 分钟）

**总时长**：约 1 小时 45 分钟

---

## 模块 1：MSW Handlers 使用（30 分钟）

### 学习目标

- 理解 MSW 的原理和优势
- 掌握现有 Handlers 的使用
- 学会创建新的 Handler
- 了解 CORS 处理方案

### 1.1 什么是 MSW？（5 分钟）

**定义**：MSW (Mock Service Worker) 是一个 API Mock 库，通过拦截网络请求返回 Mock 数据。

**核心优势**：

| 优势 | 说明 |
|------|------|
| **更真实** | 使用真实的 `fetch` API，而非 Mock 函数 |
| **更完整** | 可以测试网络错误、超时、重试等场景 |
| **更灵活** | 同一套代码可用于测试环境和开发环境 |
| **更安全** | 支持完整的类型推断 |

**对比 `vi.mock`**：

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

### 1.2 快速开始（10 分钟）

**Step 1**：导入 Handlers

```typescript
import { server } from '@/__test__/msw/setup';
import { deepSeekHandlers } from '@/__test__/msw/handlers';
```

**Step 2**：在测试中使用

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

**Step 3**：清理 Handlers

```typescript
afterEach(() => {
  server.resetHandlers();
});
```

### 1.3 可用的 Handlers（5 分钟）

| Handler | 用途 | 文件位置 |
|---------|------|---------|
| `deepSeekHandlers` | DeepSeek API | `handlers/deepseek.ts` |
| `kimiHandlers` | Moonshot AI (Kimi) API | `handlers/kimi.ts` |
| `zhipuHandlers` | ZhipuAI API | `handlers/zhipu.ts` |
| `modelsDevHandlers` | models.dev API | `handlers/models-dev.ts` |

### 1.4 场景配置（5 分钟）

**成功场景**：

```typescript
server.use(deepSeekHandlers.success());
server.use(deepSeekHandlers.success({ delay: 1000 }));
server.use(deepSeekHandlers.success({ response: customStream }));
```

**错误场景**：

```typescript
// 网络错误
server.use(deepSeekHandlers.networkError());

// 超时（默认 30 秒）
server.use(deepSeekHandlers.timeout());
server.use(deepSeekHandlers.timeout({ delay: 10000 }));

// 服务器错误（默认 500）
server.use(deepSeekHandlers.serverError());
server.use(deepSeekHandlers.serverError({ status: 503, message: 'Service Unavailable' }));
```

### 1.5 CORS 处理（5 分钟）

**问题**：MSW 默认会拦截所有请求，包括 CORS preflight 请求（OPTIONS）。

**解决方案**：在 `setup.ts` 中配置 `onUnhandledRequest: 'bypass'`：

```typescript
export const server = setupServer(
  ...allHandlers,
  {
    onUnhandledRequest: 'bypass',
  }
);
```

**验证**：运行集成测试，确认不再报告 CORS 错误。

### 实践练习

**练习 1**：使用 DeepSeek Handler 测试聊天服务（10 分钟）

```typescript
// 目标：测试 ChatService 能够正确处理流式响应
// 提示：
// 1. 使用 server.use(deepSeekHandlers.success())
// 2. 调用 streamChatCompletion()
// 3. 验证返回值

describe('ChatService 实践', () => {
  it('应该返回流式响应', async () => {
    // TODO: 编写测试
  });
});
```

**练习 2**：测试错误处理（10 分钟）

```typescript
// 目标：测试网络错误场景
// 提示：
// 1. 使用 server.use(deepSeekHandlers.networkError())
// 2. 验证错误被正确捕获

describe('ChatService 错误处理', () => {
  it('应该抛出错误 当网络请求失败', async () => {
    // TODO: 编写测试
  });
});
```

**练习 3**：创建自定义 Handler（10 分钟）

```typescript
// 目标：为新的 API 创建 Handler
// 提示：
// 1. 在 src/__test__/msw/handlers/ 中创建新文件
// 2. 实现 success、networkError 等方法
// 3. 在 index.ts 中导出

// TODO: 创建 openai.ts Handler
```

### 关键知识点

- MSW 拦截网络请求，返回 Mock 数据
- 使用 `server.use()` 配置场景
- 在 `afterEach` 中调用 `server.resetHandlers()`
- CORS 问题通过 `onUnhandledRequest: 'bypass'` 解决

---

## 模块 2：类型安全最佳实践（30 分钟）

### 学习目标

- 理解类型安全的重要性
- 掌握为 Mock 对象定义类型的方法
- 学会使用 Vitest 的 Mocked 工具
- 了解何时使用 `any` 及其注释规范

### 2.1 为什么类型安全重要？（5 分钟）

| 优势 | 说明 |
|------|------|
| **捕获错误** | 在编译时发现类型错误 |
| **提升可维护性** | 类型即文档 |
| **重构友好** | 类型系统自动检查影响范围 |
| **减少 `any`** | 避免类型丢失 |

**量化目标**：`any` 使用数量 ≤ 50 处

### 2.2 为 Mock 对象定义类型（10 分钟）

**基本方法**：定义接口

```typescript
// ✅ 定义接口
interface MockStreamTextResult {
  stream: ReadableStream;
  metadata: {
    finishReason: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
    };
  };
}

const mockStreamResult: MockStreamTextResult = {
  stream: new ReadableStream(),
  metadata: {
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20 },
  },
};
```

**使用 Partial**：

```typescript
// 完整类型
interface Model {
  id: string;
  nickname: string;
  apiKey: string;
  providerKey: string;
}

// Mock 对象可能只需要部分字段
const mockModel: Partial<Model> = {
  nickname: 'Test Model',
  apiKey: 'sk-test',
};
```

### 2.3 使用 Vitest 的 Mocked 工具（10 分钟）

**mocked() 函数**：

```typescript
import { mocked } from 'vitest';

// Mock 模块
vi.mock('@/utils/api', () => ({
  fetchData: vi.fn(),
}));

// 导入并添加类型
import { fetchData } from '@/utils/api';
const mockFetchData = mocked(fetchData);

// 使用
mockFetchData.mockResolvedValue({ data: 'test' });
expect(mockFetchData).toHaveBeenCalledWith('/api/data');
```

**类型化的 Mock 工厂**：

```typescript
import type { StandardMessage } from '@/types/chat';

const createMockPanelMessage = (overrides?: Partial<StandardMessage>): StandardMessage => ({
  id: 'mock-id',
  role: 'user',
  content: 'mock content',
  timestamp: Date.now(),
  ...overrides,
});
```

### 2.4 何时使用 `any`（5 分钟）

**允许使用的场景**：

1. **第三方库类型过于复杂**
2. **测试框架限制**
3. **临时调试**（应尽快修复）

**注释规范**：

```typescript
// 使用 any 的原因：<具体原因>
const variableName: any = value;
```

**示例**：

```typescript
// 使用 any 的原因：Vercel AI SDK 的 streamText 返回类型过于复杂
const mockStreamResult: any = createMockStreamResult();
```

### 实践练习

**练习 1**：为 Mock 对象定义类型（10 分钟）

```typescript
// 目标：为以下 Mock 对象定义类型
const mockApiResponse = {
  data: 'test',
  status: 200,
  headers: {
    'content-type': 'application/json',
  },
};

// TODO: 定义 MockApiResponse 接口
```

**练习 2**：使用 mocked() 函数（10 分钟）

```typescript
// 目标：使用 mocked() 为以下模块添加类型
vi.mock('@/utils/storage', () => ({
  loadFromStore: vi.fn(),
  saveToStore: vi.fn(),
}));

// TODO: 使用 mocked() 添加类型
```

**练习 3**：统计 `any` 使用数量（10 分钟）

```bash
# 运行以下命令统计 any 使用数量
grep -r "any" src/__test__/ --exclude-dir=node_modules | wc -l

# 查找未注释的 any 使用
grep -r ": any" src/__test__/ --exclude-dir=node_modules | grep -v "使用 any 的原因"
```

### 关键知识点

- 始终为 Mock 对象定义类型
- 使用 `mocked()` 添加类型
- 使用 `Partial` 处理部分字段
- `any` 使用必须添加注释

---

## 模块 3：Fixtures 使用（15 分钟）

### 学习目标

- 理解 Fixtures 的作用和优势
- 掌握现有 Fixtures 的使用
- 学会自定义 Fixtures

### 3.1 什么是 Fixtures？（3 分钟）

**定义**：Fixtures 是测试数据的工厂函数，用于创建标准的测试数据对象。

**优势**：

| 优势 | 说明 |
|------|------|
| **快速创建** | 一行代码创建完整的测试对象 |
| **灵活覆盖** | 通过 `overrides` 参数自定义任何字段 |
| **类型安全** | 完整的 TypeScript 类型定义 |
| **运行时验证** | 使用 Zod schema 验证数据结构 |

### 3.2 可用的 Fixtures（5 分钟）

| Fixture | 用途 | 文件位置 |
|---------|------|---------|
| `createMockModel` | 创建模型数据 | `fixtures/models.ts` |
| `createMockMessage` | 创建聊天消息 | `fixtures/chat.ts` |
| `createDeepSeekProvider` | 创建供应商数据 | `fixtures/modelProvider.ts` |
| `createTestRootState` | 创建 Redux 根状态 | `helpers/mocks/testState.ts` |

### 3.3 快速开始（5 分钟）

**基本用法**：

```typescript
import { createMockModel } from '@/__test__/fixtures/models';

// 创建默认的模型数据
const model = createMockModel();
// 结果：{ id: 'test-model-xxx', nickname: 'Test Model', ... }
```

**覆盖属性**：

```typescript
// 自定义特定字段
const customModel = createMockModel({
  nickname: 'Custom Model',
  apiKey: 'sk-custom-key',
});
```

**批量创建**：

```typescript
import { createMockModels } from '@/__test__/fixtures/models';

// 创建 5 个模型
const models = createMockModels(5);
```

### 3.4 最佳实践（2 分钟）

**使用 Fixtures 减少重复**：

```typescript
// ❌ 不好：手动构造复杂对象
const provider = {
  providerKey: 'deepseek',
  providerName: 'DeepSeek',
  api: 'https://api.deepseek.com/v1',
  models: [/* ... */],
};

// ✅ 好：使用 Fixture
const provider = createDeepSeekProvider();
```

### 实践练习

**练习**：使用 Fixtures 简化测试（10 分钟）

```typescript
// 目标：使用 Fixtures 替换手动构造的数据

describe('ModelSlice', () => {
  it('应该添加模型', () => {
    // Before: 手动构造
    const newModel = {
      id: 'model-1',
      nickname: 'GPT-4',
      apiKey: 'sk-test',
      providerKey: 'openai',
      // ... 更多字段
    };

    // After: 使用 Fixture
    const newModel = createMockModel({ nickname: 'GPT-4' });

    const state = modelSlice.reducer(undefined, {
      type: 'models/addModel',
      payload: newModel,
    });

    expect(state.models).toContainEqual(newModel);
  });
});
```

### 关键知识点

- Fixtures 提供一致的测试数据
- 使用 `overrides` 参数自定义数据
- 批量创建时使用函数参数
- 优先使用 Fixtures 而非手动构造

---

## 模块 4：行为驱动测试（30 分钟）

### 学习目标

- 理解行为驱动测试的核心理念
- 掌握测试用户可见行为的方法
- 学会识别和避免测试内部实现

### 4.1 什么是行为驱动测试？（5 分钟）

**核心理念**：**测试用户可见行为，而非内部实现细节**。

**判断标准**：**如果我重构内部逻辑，测试代码是否可以完全不改？**

如果答案是否定的，说明测试过度关注实现细节。

### 4.2 测试命名规范（5 分钟）

**格式**："应该 [预期行为] 当 [条件]"

**示例**：

| 测试类型 | 好的命名 | 不好的命名 |
|---------|---------|-----------|
| 组件测试 | 应该显示错误提示 当 API 请求失败 | 应该调用 handleError |
| Hooks 测试 | 应该延迟更新值 当输入值变化 | 应该设置定时器 |
| Redux 测试 | 应该加载模型列表 当初始化完成 | 应该设置 loading 为 true |

### 4.3 如何识别测试内部实现（5 分钟）

**检查清单**：

- [ ] 测试内部方法调用（如 `expect(handleError).toHaveBeenCalled()`）
- [ ] Mock 子组件（如 `vi.mock('@/components/Button')`）
- [ ] 测试中间状态转换（如 Redux `pending` → `fulfilled`）
- [ ] 断言内部函数调用次数（如 `expect(setTimeout).toHaveBeenCalledTimes(1)`）

**示例对比**：

```typescript
// ❌ 测试内部实现
it('应该调用 handleError 当请求失败', () => {
  const handleErrorSpy = vi.spyOn(component, 'handleError');
  expect(handleErrorSpy).toHaveBeenCalled();
});

// ✅ 测试用户可见行为
it('应该显示错误提示 当 API 请求失败', async () => {
  render(<ChatPage />);
  await userEvent.click(screen.getByText('发送'));
  expect(await screen.findByText('网络错误')).toBeInTheDocument();
});
```

### 4.4 如何编写行为测试（10 分钟）

**Step 1**：识别用户行为

```typescript
// 用户视角：
// 1. 点击"发送"按钮
// 2. 看到加载指示器
// 3. 看到助手回复
```

**Step 2**：Mock 系统边界

```typescript
// ✅ Mock API 请求（系统边界）
beforeEach(() => {
  server.use(deepSeekHandlers.success());
});

// ❌ 不 Mock 内部 Hook
// vi.mock('@/hooks/useChat', () => ({ /* ... */ }));
```

**Step 3**：使用用户交互

```typescript
import { userEvent } from '@testing-library/user-event';

// 模拟用户输入
await userEvent.type(screen.getByLabelText('邮箱'), 'invalid-email');
await userEvent.click(screen.getByText('登录'));
```

**Step 4**：验证用户可见结果

```typescript
// 验证 UI 渲染
expect(screen.getByText('测试聊天')).toBeInTheDocument();

// 验证数据展示
expect(screen.getAllByRole('listitem')).toHaveLength(10);

// 验证用户反馈
expect(await screen.findByText('保存成功')).toBeInTheDocument();
```

### 4.5 最佳实践（5 分钟）

**原则 1**：测试用户交互

```typescript
it('应该删除聊天 当用户点击删除按钮', async () => {
  render(<ChatSidebar />);
  await userEvent.click(screen.getByText('删除'));
  expect(screen.queryByText('测试聊天')).not.toBeInTheDocument();
});
```

**原则 2**：渲染完整组件树

```typescript
// ✅ 渲染完整组件树
render(<ChatPage />);

// ❌ Mock 子组件
vi.mock('@/components/ChatButton', () => ({
  default: () => <button>Mock</button>
}));
```

### 实践练习

**练习 1**：重构测试为行为测试（10 分钟）

```typescript
// 目标：将以下测试改为行为测试
it('应该调用 validateEmail', () => {
  const validateSpy = vi.spyOn(utils, 'validateEmail');
  render(<LoginForm email="test@example.com" />);
  expect(validateSpy).toHaveBeenCalledWith('test@example.com');
});

// TODO: 重构为行为测试
```

**练习 2**：编写新的行为测试（10 分钟）

```typescript
// 目标：为以下场景编写行为测试
// 场景：用户发送消息后，应该显示助手回复

describe('聊天流程', () => {
  it('应该显示助手回复 当用户发送消息', async () => {
    // TODO: 编写行为测试
    // 提示：
    // 1. Mock API 请求
    // 2. 渲染组件
    // 3. 模拟用户点击发送
    // 4. 验证助手回复显示
  });
});
```

### 关键知识点

- 测试用户可见行为，而非内部实现
- 使用"应该...当..."的命名格式
- Mock 系统边界，不 Mock 内部实现
- 验证用户可见结果（UI 渲染、数据展示）

---

## 总结

### 检查清单

**MSW Handlers**：
- [ ] 能够导入和使用现有 Handlers
- [ ] 能够配置成功和错误场景
- [ ] 了解 CORS 处理方案
- [ ] 能够创建新的 Handler

**类型安全**：
- [ ] 能够为 Mock 对象定义类型
- [ ] 能够使用 `mocked()` 添加类型
- [ ] 了解何时使用 `any` 及其注释规范
- [ ] 能够统计 `any` 使用数量

**Fixtures**：
- [ ] 能够使用现有 Fixtures
- [ ] 能够自定义数据
- [ ] 了解批量创建的方法
- [ ] 能够简化测试代码

**行为驱动测试**：
- [ ] 理解"测试用户可见行为"的理念
- [ ] 能够使用正确的命名格式
- [ ] 能够识别测试内部实现
- [ ] 能够编写行为测试

### 下一步行动

1. **立即应用**：在下一个测试中使用新的工具和方法
2. **代码审查**：使用检查清单审查现有测试
3. **持续改进**：定期回顾和优化测试代码

### 参考文档

- [测试辅助工具文档](../README.md)
- [MSW Handlers 使用指南](../msw/README.md)
- [Fixtures 使用指南](../fixtures/README.md)
- [行为驱动测试指南](./BDD_GUIDE.md)
- [类型安全指南](./TYPE_SAFETY_GUIDE.md)

---

## 附录：快速参考

### MSW Handlers 快速参考

```typescript
import { server } from '@/__test__/msw/setup';
import { deepSeekHandlers } from '@/__test__/msw/handlers';

// 成功场景
server.use(deepSeekHandlers.success());

// 错误场景
server.use(deepSeekHandlers.networkError());
server.use(deepSeekHandlers.timeout());
server.use(deepSeekHandlers.serverError());

// 清理
afterEach(() => {
  server.resetHandlers();
});
```

### Fixtures 快速参考

```typescript
import { createMockModel, createMockMessage } from '@/__test__/fixtures';

// 创建单个对象
const model = createMockModel({ nickname: 'GPT-4' });

// 批量创建
const models = createMockModels(5);
```

### 类型安全快速参考

```typescript
// 定义类型
interface MockApiResponse {
  data: string;
  status: number;
}

// 使用 mocked()
import { mocked } from 'vitest';
const mockFetchData = mocked(fetchData);

// any 注释
// 使用 any 的原因：第三方库类型过于复杂
const complexMock: any = createComplexMock();
```

### 行为驱动测试快速参考

```typescript
// 测试命名
it('应该显示错误提示 当 API 请求失败', async () => {
  // 1. Mock 系统边界
  server.use(deepSeekHandlers.networkError());

  // 2. 渲染组件
  render(<ChatPage />);

  // 3. 用户交互
  await userEvent.click(screen.getByText('发送'));

  // 4. 验证结果
  expect(await screen.findByText('网络错误')).toBeInTheDocument();
});
```

---

**培训结束！如有疑问，请参考相关文档或联系测试负责人。**
