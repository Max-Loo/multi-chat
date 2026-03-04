# Fixtures 使用指南

## 什么是 Fixtures？

Fixtures 是测试数据的工厂函数，用于创建标准的测试数据对象。它们提供了一致、可重用的测试数据，减少重复代码，提高测试可维护性。

### 为什么使用 Fixtures？

- **减少重复代码**：不再需要在每个测试中手动构造复杂的测试对象
- **提高测试可读性**：使用语义化的工厂函数名，测试意图更清晰
- **保证数据一致性**：所有测试使用相同的数据结构，避免因数据格式不一致导致的测试失败
- **易于维护**：当数据结构变化时，只需修改 Fixture，测试代码无需改动
- **类型安全**：每个 Fixture 都有完整的类型定义和运行时验证

### Fixtures 的优势

| 优势 | 说明 |
|------|------|
| **快速创建** | 一行代码创建完整的测试对象 |
| **灵活覆盖** | 通过 `overrides` 参数自定义任何字段 |
| **类型安全** | 完整的 TypeScript 类型定义 |
| **运行时验证** | 使用 Zod schema 验证数据结构 |
| **语义化** | 函数名清晰表达数据用途 |

## 可用的 Fixtures

### 1. ModelProvider Fixtures (`modelProvider.ts`)

供应商数据的工厂函数，用于创建模型供应商测试数据。

**可用函数**：

- `createDeepSeekProvider(overrides?)` - 创建 DeepSeek 供应商数据
- `createKimiProvider(overrides?)` - 创建 Kimi (Moonshot AI) 供应商数据
- `createZhipuProvider(overrides?)` - 创建 ZhipuAI 供应商数据
- `createMockRemoteProvider(overrides?)` - 创建通用供应商数据
- `createMockRemoteProviders(providers?)` - 批量创建供应商数据

**特性**：使用 Zod schema 验证数据结构，确保生成的数据符合 `RemoteProviderData` 类型。

### 2. Model Fixtures (`models.ts`)

模型数据的工厂函数，用于创建 AI 模型测试数据。

**可用函数**：

- `createMockModel(overrides?)` - 创建通用模型数据
- `createMockModels(count, overrides?)` - 批量创建模型数据
- `createDeepSeekModel(overrides?)` - 创建 DeepSeek 模型
- `createKimiModel(overrides?)` - 创建 Kimi 模型
- `createEncryptedModel(overrides?)` - 创建已加密 API Key 的模型

### 3. Chat Fixtures (`chat.ts`)

聊天消息的工厂函数，用于创建标准化聊天消息测试数据。

**可用函数**：

- `createMockMessage(overrides?)` - 创建通用消息
- `createUserMessage(content?, overrides?)` - 创建用户消息
- `createAssistantMessage(content?, overrides?)` - 创建助手消息
- `createReasoningMessage(content, reasoning, overrides?)` - 创建包含推理内容的消息
- `createSystemMessage(content?, overrides?)` - 创建系统消息
- `createMessageWithUsage(inputTokens, outputTokens, overrides?)` - 创建包含 Token 使用信息的消息
- `createMockMessages(count, overrides?)` - 批量创建消息（模拟对话历史）
- `createMarkdownMessage(markdownContent?)` - 创建包含 Markdown 格式的消息
- `createLongMessage(lines?)` - 创建长消息（用于测试换行和截断）
- `createCodeMessage(code?, language?)` - 创建包含代码的消息
- `getTestMessages()` - 获取所有类型的测试消息集合

### 4. Store Fixtures (`helpers/fixtures/reduxState.ts`)

Redux 状态的工厂函数，用于创建测试用的 Redux state。

**注意**：这些 Fixtures 位于 `src/__test__/helpers/fixtures/reduxState.ts`，可以通过 `@/__test__/helpers/fixtures` 导入。

**可用函数**：

- `createMockChatPageState(overrides?)` - 创建 ChatPage 状态
- `createMockAppConfigState(overrides?)` - 创建应用配置状态
- `createMockModelProviderState(overrides?)` - 创建模型供应商状态
- `createMockRootState(overrides?)` - 创建完整的 Redux 根状态

### 5. Router Fixtures (`router.ts`)

路由配置的工厂函数，用于创建测试用的路由数据。

**可用函数**：

- `getRouteStructure()` - 获取路由配置结构数据
- `getAllRoutes()` - 获取所有路由路径
- `getRedirectRules()` - 获取重定向规则
- `getInvalidRoutes()` - 获取无效路由路径（用于测试错误处理）
- `getNestedRoutes()` - 获取嵌套路由测试数据

### 6. ChatPanel Fixtures (`helpers/mocks/chatPanel.ts`)

ChatPanel 相关数据的工厂函数（与 `chat.ts` 功能类似，但更专注于面板场景）。

**注意**：这些 Fixtures 位于 `src/__test__/helpers/mocks/chatPanel.ts`，可以通过 `@/__test__/helpers/mocks` 导入。

**可用函数**：

- `createUserMessage(overrides?)` - 创建用户消息
- `createAssistantMessage(overrides?)` - 创建助手消息
- `createReasoningMessage(reasoningContent, overrides?)` - 创建包含推理内容的消息
- `createSystemMessage(overrides?)` - 创建系统消息
- `createToolMessage(overrides?)` - 创建工具消息
- `createStreamingMessages(chunkCount, baseMessage?)` - 创建流式消息序列
- `createMessageWithUsage(inputTokens, outputTokens, overrides?)` - 创建包含 Token 使用情况的消息
- `createConversationHistory(rounds)` - 创建多轮对话历史

**注意**：此 Fixtures 与 `chat.ts` 有部分重复，推荐优先使用 `chat.ts`。

## 快速入门

### 基本用法

```typescript
import { createMockModel } from '@/__test__/fixtures/models';
import { createUserMessage } from '@/__test__/fixtures/chat';
import { createMockRootState } from '@/__test__/helpers/fixtures';

// 创建默认的模型数据
const model = createMockModel();
// 结果：{ id: 'test-model-xxx', nickname: 'Test Model', ... }

// 创建用户消息
const message = createUserMessage('Hello, world!');

// 创建完整的 Redux state
const state = createMockRootState();
```

### 覆盖属性

```typescript
import { createMockModel } from '@/__test__/fixtures/models';

// 自定义特定字段
const customModel = createMockModel({
  nickname: 'Custom Model',
  apiKey: 'sk-custom-key',
});

// 结果：{ id: 'test-model-xxx', nickname: 'Custom Model', apiKey: 'sk-custom-key', ... }
```

### 批量创建

```typescript
import { createMockModels } from '@/__test__/fixtures/models';

// 创建 5 个模型，每个都有不同的 ID
const models = createMockModels(5);

// 创建 5 个模型，每个都有不同的名称
const models = createMockModels(5, (index) => ({
  nickname: `Model ${index + 1}`,
}));
```

### 创建特定类型的数据

```typescript
import { createDeepSeekProvider } from '@/__test__/fixtures/modelProvider';
import { createUserMessage } from '@/__test__/fixtures/chat';
import { createMockRootState } from '@/__test__/helpers/fixtures';

// 创建 DeepSeek 供应商
const provider = createDeepSeekProvider();

// 创建用户消息
const message = createUserMessage('Hello, world!');

// 创建完整的 Redux state
const state = createMockRootState({
  modelProvider: {
    providers: [provider],
    loading: false,
    error: null,
  },
});
```

## 使用场景

### 场景 1：单元测试中使用 Fixtures

```typescript
import { describe, it, expect } from 'vitest';
import { createMockModel, createMockModels } from '@/__test__/fixtures';
import { modelSlice } from '@/store/slices/modelSlice';

describe('modelSlice', () => {
  it('应该添加模型 当调用 addModel', () => {
    const newModel = createMockModel({ nickname: 'GPT-4' });
    const state = modelSlice.reducer(undefined, {
      type: 'models/addModel',
      payload: newModel,
    });

    expect(state.models).toContainEqual(newModel);
  });

  it('应该加载模型列表 当调用 fetchModels', () => {
    const mockModels = createMockModels(3);
    const state = modelSlice.reducer(undefined, {
      type: 'models/fetchModels/fulfilled',
      payload: mockModels,
    });

    expect(state.models).toHaveLength(3);
  });
});
```

### 场景 2：集成测试中使用 Fixtures

```typescript
import { describe, it, expect } from 'vitest';
import { createMockMessage, createMockMessages } from '@/__test__/fixtures';
import { render, screen } from '@testing-library/react';
import ChatPanel from '@/components/ChatPanel';

describe('ChatPanel 集成测试', () => {
  it('应该渲染消息列表', () => {
    const messages = createMockMessages(5);
    render(<ChatPanel messages={messages} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('应该显示用户消息', () => {
    const userMessage = createMockMessage({
      role: 'user',
      content: 'Hello!',
    });
    render(<ChatPanel messages={[userMessage]} />);

    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });
});
```

### 场景 3：MSW Handlers 中使用 Fixtures

```typescript
import { rest } from 'msw';
import { createDeepSeekProvider, createKimiProvider } from '@/__test__/fixtures';

export const modelsDevHandlers = [
  rest.get('https://models.dev/api.json', (req, res, ctx) => {
    return res(
      ctx.json([
        createDeepSeekProvider(),
        createKimiProvider(),
      ])
    );
  }),
];
```

## 最佳实践

### 1. 使用 Fixtures 减少重复

```typescript
// ❌ 不好：手动构造复杂对象
const provider = {
  providerKey: 'deepseek',
  providerName: 'DeepSeek',
  api: 'https://api.deepseek.com/v1',
  models: [
    {
      modelKey: 'deepseek-chat',
      modelName: 'DeepSeek Chat',
    },
    {
      modelKey: 'deepseek-coder',
      modelName: 'DeepSeek Coder',
    },
  ],
};

// ✅ 好：使用 Fixture
const provider = createDeepSeekProvider();
```

### 2. 覆盖特定属性

```typescript
// ✅ 使用 overrides 参数自定义数据
const provider = createDeepSeekProvider({
  apiKey: 'test-key',
  models: [
    {
      modelKey: 'custom-model',
      modelName: 'Custom Model',
    },
  ],
});
```

### 3. 批量创建时使用函数

```typescript
// ✅ 使用函数为每个元素生成不同的数据
const models = createMockModels(5, (index) => ({
  nickname: `Model ${index + 1}`,
  modelKey: `model-${index + 1}`,
}));
```

### 4. 使用语义化的 Fixture 名称

```typescript
// ✅ 优先使用特定类型的 Fixture
const userMsg = createUserMessage('Hello');
const assistantMsg = createAssistantMessage('Hi there');

// 而不是通用 Fixture
const userMsg = createMockMessage({ role: 'user', content: 'Hello' });
const assistantMsg = createMockMessage({ role: 'assistant', content: 'Hi there' });
```

### 5. 验证数据结构

```typescript
// ✅ modelProvider.ts 中的所有 Fixtures 都有 Zod 验证
// 如果数据结构不正确，会抛出 FixtureValidationError
import { createDeepSeekProvider } from '@/__test__/fixtures/modelProvider';

try {
  const provider = createDeepSeekProvider({
    providerKey: '', // 空字符串会触发验证错误
  });
} catch (error) {
  if (error instanceof FixtureValidationError) {
    console.error(error.validationErrors);
  }
}
```

## 常见错误和解决方案

### 错误 1：类型不匹配

**问题**：传入的 `overrides` 参数类型不正确。

```typescript
// ❌ 错误：传入了不存在的字段
const model = createMockModel({
  invalidField: 'value',
});
```

**解决方案**：检查 TypeScript 类型定义，确保传入的字段存在于类型中。

### 错误 2：验证失败

**问题**：modelProvider Fixtures 抛出 `FixtureValidationError`。

```typescript
// ❌ 错误：providerKey 为空字符串
const provider = createDeepSeekProvider({
  providerKey: '',
});
```

**解决方案**：确保传入的数据符合 Zod schema 验证规则。查看错误提示中的 `validationErrors` 字段。

### 错误 3：导入路径错误

**问题**：导入 Fixtures 时路径不正确。

```typescript
// ❌ 错误：使用了相对路径
import { createMockModel } from '../../../fixtures/models';

// ✅ 正确：使用 @/ 别名
import { createMockModel } from '@/__test__/fixtures/models';
```

**解决方案**：始终使用 `@/` 别名导入，避免使用相对路径。

### 错误 4：重复的 Fixtures

**问题**：`chat.ts` 和 `chatPanel.ts` 中有重复的函数。

```typescript
// ⚠️  可能混淆：createUserMessage 在两个文件中都存在
import { createUserMessage } from '@/__test__/fixtures/chat';
import { createUserMessage } from '@/__test__/fixtures/chatPanel';
```

**解决方案**：优先使用 `chat.ts` 中的 Fixtures，`chatPanel.ts` 已标记为可能删除。

## 扩展 Fixtures

### 添加新的工厂函数

如果现有的 Fixtures 不满足需求，可以添加新的工厂函数：

1. **确定数据类型**：在对应的 Fixture 文件中找到相关类型
2. **创建工厂函数**：参考现有函数的模式
3. **添加 JSDoc 注释**：说明用途、参数和返回值
4. **添加验证**：如果使用 modelProvider 模式，添加 Zod schema 验证

**示例**：

```typescript
/**
 * 创建 OpenAI 模型
 * @param overrides 要覆盖的字段
 * @returns OpenAI 模型对象
 */
export const createOpenAIModel = (overrides?: Partial<Model>): Model =>
  createMockModel({
    providerName: 'OpenAI',
    providerKey: ModelProviderKeyEnum.OPENAI,
    nickname: 'GPT-4',
    modelName: 'gpt-4',
    modelKey: 'gpt-4',
    apiAddress: 'https://api.openai.com/v1',
    ...overrides,
  });
```

### 复用现有 Fixtures

**示例**：创建一个完整的聊天场景 Fixture

```typescript
/**
 * 创建完整的聊天场景
 * @returns 包含用户消息和助手回复的消息数组
 */
export const createChatScenario = (): StandardMessage[] => {
  const userMessage = createUserMessage('What is the capital of France?');
  const assistantMessage = createAssistantMessage('The capital of France is Paris.');
  return [userMessage, assistantMessage];
};
```

## 相关文档

- [测试辅助工具文档](../README.md)
- [集成测试指南](../integration/README.md)
- [Vitest 文档](https://vitest.dev/)
- [Zod 文档](https://zod.dev/)

## 贡献指南

如果发现 Fixtures 有问题或需要新的 Fixture，请：

1. 检查现有的 Fixtures 是否满足需求
2. 确认新 Fixture 的使用场景
3. 添加完整的 JSDoc 注释和类型定义
4. 添加使用示例到本 README
5. 确保所有测试通过
