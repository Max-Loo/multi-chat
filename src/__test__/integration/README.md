# 集成测试指南

## 概述

集成测试用于验证多个模块协作时的行为，确保关键业务流程的端到端正确性。

### 与单元测试的区别

| 特性         | 单元测试                     | 集成测试                           |
| ------------ | ---------------------------- | ---------------------------------- |
| 测试范围     | 单个函数/组件                | 多个模块协作                       |
| Mock 策略    | Mock 所有外部依赖            | 仅 Mock 外部服务                   |
| 执行速度     | 快（毫秒级）                 | 较慢（秒级）                       |
| 测试目标     | 验证逻辑正确性               | 验证数据流和模块协作               |
| 测试环境     | 简单隔离                     | 接近真实环境                       |

### 测试范围

**集成测试覆盖**：
- 完整聊天流程（用户输入 → API 调用 → 流式响应 → Redux 更新 → 持久化）
- 模型配置管理（添加、编辑、删除、加密存储）
- 设置变更流程（语言切换、配置更新、持久化）
- 跨平台兼容性（Tauri vs Web 环境）

**不包含**：
- 单个函数的单元测试（已有单元测试覆盖）
- UI 组件的渲染测试（组件测试覆盖）
- 真实 E2E 测试（使用 Playwright/Cypress，留待后续）

## 运行测试

### 运行集成测试

```bash
# 运行集成测试（监听模式）
pnpm test:integration

# 运行集成测试（单次运行）
pnpm test:integration:run

# 运行所有测试（单元测试 + 集成测试）
pnpm test:all
```

### 测试配置

集成测试使用独立的配置文件 `vitest.integration.config.ts`：

- **测试超时**：30 秒
- **串行执行**：`maxConcurrency: 1`（避免数据竞争）
- **测试隔离**：每个测试独立运行
- **测试环境**：happy-dom（模拟浏览器环境）

## 编写测试

### 测试文件结构

集成测试文件位于 `src/__test__/integration/`，命名格式为 `*.integration.test.ts`。典型结构：

1. 模块级 `vi.mock()` 声明（Vitest 会自动提升到文件顶部）
2. `describe` 套件包裹所有测试用例
3. `beforeEach` 中清理状态（`vi.clearAllMocks()` + `clearIndexedDB()` + `getTestStore()`）
4. `afterEach` 中调用 `resetStore()` 释放 store

完整的测试模板见下方"测试模板"小节。

### 测试命名规范

- **测试文件**：`*.integration.test.ts`
- **测试套件**：`describe('功能名称集成测试', () => {})`
- **测试用例**：`test('应该 [预期行为] 当 [条件]', async () => {})`

**示例**：
- ✅ `应该完成完整聊天流程当用户发送消息`
- ✅ `应该正确保存聊天记录当流式响应完成`
- ❌ `testChatFlow`（过于模糊）
- ❌ `测试聊天功能`（不符合格式）

### 测试模板

#### 基础模板

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { getTestStore, resetStore } from '@/__test__/helpers/integration/resetStore';
import { clearIndexedDB } from '@/__test__/helpers/integration/clearIndexedDB';

// Mock 外部依赖（模块级，会被 Vitest 提升到文件顶部）
vi.mock('@/services/chat', async () => {
  const actual = await vi.importActual<typeof import('@/services/chat')>('@/services/chat');
  return {
    ...actual,
    streamChatCompletion: vi.fn(() => ({
      [Symbol.asyncIterator]: async function* () {
        yield { type: 'text-delta', textDelta: '模拟的 AI 回复' };
        yield { type: 'finish', finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 5 } };
      },
    })),
  };
});

describe('功能名称集成测试', () => {
  let store: ReturnType<typeof getTestStore>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearIndexedDB();
    store = getTestStore();
  });

  afterEach(() => {
    resetStore();
  });

  it('应该完成预期行为', async () => {
    // Given
    const testData = { /* ... */ };

    // When
    await act(async () => {
      // 执行操作
    });

    // Then
    const state = store.getState();
    expect(state.xxx).toBe(expectedValue);
  });
});
```

#### 聊天流程测试模板

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { getTestStore, resetStore } from '@/__test__/helpers/integration/resetStore';
import { clearIndexedDB } from '@/__test__/helpers/integration/clearIndexedDB';
import { createChat, startSendChatMessage, setSelectedChatId } from '@/store/slices/chatSlices';
import { createModel as createModelAction } from '@/store/slices/modelSlice';
import { createDeepSeekModel } from '@/__test__/helpers/fixtures/model';
import * as chatStorage from '@/store/storage/chatStorage';

// Mock streamChatCompletion 模拟流式 AI 回复
vi.mock('@/services/chat', async () => {
  const actual = await vi.importActual<typeof import('@/services/chat')>('@/services/chat');
  return {
    ...actual,
    streamChatCompletion: vi.fn(() => ({
      [Symbol.asyncIterator]: async function* () {
        await new Promise(resolve => setTimeout(resolve, 100));
        yield { type: 'text-delta', textDelta: '模拟的 AI 回复' };
        await new Promise(resolve => setTimeout(resolve, 50));
        yield { type: 'finish', finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 5 } };
      },
    })),
  };
});

// Mock chatStorage 隔离持久化层
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatIndex: vi.fn(() => Promise.resolve([])),
  saveChatIndex: vi.fn(() => Promise.resolve()),
  loadChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatById: vi.fn(() => Promise.resolve()),
  saveChatAndIndex: vi.fn(() => Promise.resolve()),
  deleteChatFromStorage: vi.fn(() => Promise.resolve()),
  migrateOldChatStorage: vi.fn(() => Promise.resolve()),
}));

describe('聊天流程集成测试', () => {
  let store: ReturnType<typeof getTestStore>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearIndexedDB();
    store = getTestStore();
  });

  afterEach(() => {
    resetStore();
  });

  it('应该完成完整聊天流程当用户发送消息', async () => {
    // Given: 创建模型和聊天
    const model = createDeepSeekModel();
    const chat = {
      id: 'test-chat-1',
      chatModelList: [{ modelId: model.id, chatHistoryList: [] }],
      isDeleted: false,
    };

    store.dispatch(createModelAction({ model }));
    store.dispatch(createChat({ chat }));
    store.dispatch(setSelectedChatId(chat.id));

    // When: 发送消息
    await act(async () => {
      await store.dispatch(startSendChatMessage({ chat, message: '你好' }));
    });

    // Then: 验证 Redux store 更新
    await waitFor(() => {
      const state = store.getState();
      const chatData = state.chat.activeChatData[chat.id];
      expect(chatData?.chatModelList?.[0]?.chatHistoryList?.length).toBeGreaterThan(0);
    });

    // 验证持久化被调用
    expect(chatStorage.saveChatAndIndex).toHaveBeenCalled();
  });
});
```

## 最佳实践

### 1. 测试隔离

**原则**：每个测试必须独立运行，不依赖其他测试的状态。

```typescript
beforeEach(async () => {
  // 清理 Redux store
  resetStore();

  // 清理 IndexedDB
  await clearIndexedDB();

  // 清理所有 mocks
  vi.clearAllMocks();
});
```

### 2. 使用 Given-When-Then 模式

```typescript
test('应该完成预期行为当条件满足', async () => {
  // Given: 准备测试数据和环境
  const testData = { /* ... */ };
  const mockFn = vi.fn();

  // When: 执行操作
  await act(async () => {
    // 触发操作
  });

  // Then: 验证结果
  expect(result).toBe(expectedValue);
});
```

### 3. 避免测试之间的依赖

```typescript
// ❌ 错误：测试之间有依赖
let chatId: string;
test('创建聊天', () => {
  chatId = createChat();
});
test('发送消息', () => {
  sendMessage(chatId); // 依赖上一个测试
});

// ✅ 正确：每个测试独立
test('应该发送消息当聊天已存在', () => {
  const chatId = createChat(); // 在当前测试中创建
  sendMessage(chatId);
});
```

### 4. 使用 waitFor 处理异步操作

```typescript
import { waitFor } from '@testing-library/react';

test('应该等待异步操作完成', async () => {
  await act(async () => {
    dispatch(someAsyncAction());
  });

  await waitFor(() => {
    expect(store.getState().data).toBeDefined();
  });
});
```

### 5. 测试覆盖率目标

集成测试应覆盖关键业务流程，而非所有场景：

- ✅ 完整聊天流程（正常场景 + 错误场景）
- ✅ 模型配置管理（添加、编辑、删除）
- ✅ 设置变更流程（语言切换、配置更新）
- ❌ 单个函数的边界情况（单元测试覆盖）
- ❌ UI 组件的渲染逻辑（组件测试覆盖）

## Mock 策略

### 分层 Mock 策略

集成测试采用分层 Mock 策略，平衡真实性和可控性：

| 层级           | Mock 策略                   | 工具                           | 理由                     |
| -------------- | --------------------------- | ------------------------------ | ------------------------ |
| **外部 API**   | Mock Service 层模块替换     | `vi.mock` + `vi.importActual`  | 模块级替换，稳定可控     |
| **存储层**     | 使用真实实现                | fake-indexeddb                 | 验证持久化逻辑           |
| **加密层**     | 使用真实实现                | crypto.ts                      | 验证加密链路             |
| **Redux**      | 使用真实 Store              | configureStore                 | 验证状态管理             |
| **React 组件** | 真实渲染                    | React Testing Lib              | 验证用户交互             |

### Mock Service 层

对于需要特定行为的场景，可以直接 Mock Service 层：

```typescript
// 方式一：部分 Mock（保留模块其他导出，仅替换目标函数）
vi.mock('@/services/chat', async () => {
  const actual = await vi.importActual<typeof import('@/services/chat')>('@/services/chat');
  return {
    ...actual,
    streamChatCompletion: vi.fn(() => ({
      [Symbol.asyncIterator]: async function* () {
        yield { id: 'msg-1', content: 'Mock 响应' };
      },
    })),
  };
});

// 方式二：完整替换模块
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatsFromJson: vi.fn(() => Promise.resolve([])),
  saveChatsToJson: vi.fn(() => Promise.resolve()),
}));

// 方式三：vi.hoisted + vi.mock（需要共享可变引用时）
const memoryStore = vi.hoisted(() => new Map<string, unknown>());
vi.mock('@/utils/tauriCompat', () => globalThis.__createTauriCompatModuleMock(memoryStore));
```

### Mock 存储层

对于需要验证存储逻辑的场景，可以 Mock 存储层：

```typescript
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatsFromJson: vi.fn(() => Promise.resolve([])),
  saveChatsToJson: vi.fn(() => Promise.resolve()),
}));

// 验证存储被调用
expect(chatStorage.saveChatsToJson).toHaveBeenCalled();
```

## 测试辅助工具

项目提供了集成测试专用的辅助工具，位于 `src/__test__/helpers/integration/`：

### resetStore.ts

Redux store 重置工具：

```typescript
import { getTestStore, resetStore, cleanupStore } from '@/__test__/helpers/integration/resetStore';

// 获取测试 store
const store = getTestStore();

// 重置 store（清空状态，保留 store 实例）
resetStore();

// 清理 store（销毁 store 实例）
cleanupStore();
```

### clearIndexedDB.ts

IndexedDB 清理工具：

```typescript
import { clearIndexedDB } from '@/__test__/helpers/integration/clearIndexedDB';

// 清理所有数据库
await clearIndexedDB();
```

### waitForStorage.ts

localStorage 轮询等待工具，用于验证异步持久化结果：

```typescript
import { waitForLocalStorage } from '@/__test__/helpers/integration/waitForStorage';

// 等待 localStorage 中某个 key 变为期望值
await waitForLocalStorage('app-language', 'zh-CN');

// 等待 key 被删除
await waitForLocalStorage('temp-key', null);
```

## 常见问题

### Q1: 集成测试执行时间过长怎么办？

**原因**：集成测试涉及真实的数据流和多个模块协作。

**解决方案**：
- 确保 Mock 策略正确（使用 `vi.mock` 替换外部依赖）
- 避免不必要的等待时间（使用 `waitFor` 而非固定延迟）
- 考虑将慢速测试分离到单独的测试套件

### Q2: 测试之间数据污染怎么办？

**原因**：测试清理不彻底。

**解决方案**：
- 在 `beforeEach` 中清理所有状态（Redux、IndexedDB、localStorage）
- 使用 `resetStore()` 和 `clearIndexedDB()` 工具
- 确保每个测试使用独立的测试数据

### Q3: vi.mock 模块替换不生效怎么办？

**原因**：Vitest 的 `vi.mock` 调用会被提升到文件顶部，在 `vi.mock` 工厂函数中引用的变量可能尚未初始化。

**解决方案**：
- 使用 `vi.hoisted()` 创建需要在 `vi.mock` 工厂中引用的可变变量
- 使用 `vi.importActual()` 部分替换模块时，确保类型参数正确
- 模块级 `vi.mock` 优先于 `vi.doMock`（后者不会被提升）
- 参考 [Vitest Mocking 文档](https://vitest.dev/guide/mocking.html)

### Q4: 如何处理异步操作超时？

**原因**：异步操作未正确完成或等待时间不足。

**解决方案**：
- 使用 `waitFor` 等待异步操作完成
- 增加测试超时时间（配置 `testTimeout: 30000`）
- 确保所有异步操作都被 `act()` 包裹

### Q5: 如何调试集成测试？

**方法**：
1. 使用 `console.log` 输出中间状态
2. 使用 `--ui` 参数运行 Vitest UI（`pnpm test:integration --ui`）
3. 使用 `--inspect` 参数进行调试
4. 检查 Redux store 的状态变化
5. 检查 `vi.mock()` 的调用和返回值

### Q6: 集成测试应该覆盖哪些场景？

**原则**：聚焦关键业务流程，而非所有场景。

**应该覆盖**：
- 完整的用户工作流（如发送消息 → 接收响应 → 保存历史）
- 跨模块协作（如 UI → Redux → Service → Storage）
- 关键错误场景（如 API 错误、网络超时）

**不应该覆盖**：
- 单个函数的边界情况（单元测试覆盖）
- UI 组件的渲染细节（组件测试覆盖）
- 所有可能的错误组合（成本高，收益低）

### Q7: 集成测试与单元测试如何分工？

| 场景                | 测试类型     | 原因                           |
| ------------------- | ------------ | ------------------------------ |
| 函数逻辑            | 单元测试     | 快速反馈，易于定位问题         |
| 组件渲染            | 组件测试     | 验证 UI 行为                   |
| 完整业务流程        | 集成测试     | 验证模块协作                   |
| 端到端用户场景      | E2E 测试     | 验证真实用户体验（未来补充）   |

### Q8: 如何避免测试不稳定（Flaky Tests）？

**原因**：异步操作、定时器、Mock 数据不一致。

**解决方案**：
- 使用 `waitFor()` 而非固定延迟
- 使用 `vi.useFakeTimers()` 控制定时器
- 使用 `vi.clearAllMocks()` 清理 Mock
- 避免测试间的依赖关系
- 确保测试数据一致性和可预测性

## 参考资源

### 项目文件

- 集成测试示例：`src/__test__/integration/chat-flow.integration.test.ts`
- 集成测试配置：`vitest.integration.config.ts`
- 测试辅助工具：`src/__test__/helpers/integration/`

### 外部资源

- [Vitest 官方文档](https://vitest.dev/)
- [React Testing Library 官方文档](https://testing-library.com/react)
- [Redux Testing Best Practices](https://redux.js.org/usage/writing-tests)

## 贡献指南

### 添加新的集成测试

1. 确定测试范围（关键业务流程）
2. 创建测试文件（`*.integration.test.ts`）
3. 使用测试模板作为起点
4. 遵循命名规范和最佳实践
5. 确保测试隔离和清理
6. 运行测试验证（`pnpm test:integration:run`）

### 维护现有测试

- 定期更新 Mock 数据（与真实 API 保持一致）
- 优化慢速测试（减少不必要的等待）
- 移除重复或过时的测试
- 保持测试文档更新

---

更新日期：2026-04-29
