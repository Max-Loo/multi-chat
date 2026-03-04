# Spec: 测试数据工厂利用规范

## Purpose

定义测试数据工厂（Fixtures）的创建、使用和维护规范，确保 Fixtures 覆盖 80% 的测试数据需求，提高测试编写效率和数据一致性。

## Requirements

### Requirement: 必须激活并改进现有的测试 Fixtures

系统 SHALL 激活当前未使用的 4 个测试 Fixtures，并改进其类型定义和使用文档。

**当前未使用的 Fixtures**：
- `src/__test__/fixtures/modelProvider.ts` (114 行，包含 `createMockRemoteProvider` 等工厂函数)
- `src/__test__/fixtures/models.ts`
- `src/__test__/fixtures/store.ts`
- `src/__test__/fixtures/chatPanel.ts`

**改进目标**：
- 为所有 Fixtures 添加完整的类型定义
- 建立使用文档和示例
- 在现有测试中激活使用
- 覆盖率：Fixtures 满足 80% 的测试数据需求

#### Scenario: 激活 modelProvider Fixtures
- **WHEN** 编写与 ModelProvider 相关的测试
- **THEN** 测试 SHALL 使用 `createMockRemoteProvider` 等工厂函数
- **AND** 测试 SHALL NOT 手动构造 Provider 数据对象
- **AND** 工厂函数 SHALL 支持 `overrides` 参数自定义数据

**示例**：
```typescript
// ❌ 错误：手动构造
const mockProvider = {
  providerKey: 'deepseek',
  providerName: 'DeepSeek',
  api: 'https://api.deepseek.com',
  models: [...]
};

// ✅ 正确：使用 Fixture
import { createDeepSeekProvider } from '@/__test__/fixtures/modelProvider';
const mockProvider = createDeepSeekProvider({
  models: [{ modelKey: 'custom-model', modelName: 'Custom' }]
});
```

#### Scenario: 改进 Fixtures 的类型定义
- **WHEN** 使用 Fixtures 工厂函数
- **THEN** 函数返回值 SHALL 明确标注类型
- **AND** 类型 SHALL 与生产代码的类型定义保持一致
- **AND** `overrides` 参数 SHALL 使用 `Partial<T>` 类型

#### Scenario: 为 Fixtures 添加使用文档
- **WHEN** 新开发者需要使用 Fixtures
- **THEN** `src/__test__/fixtures/README.md` SHALL 提供完整的使用指南
- **AND** 文档 SHALL 包含每个 Fixture 的用途、参数、示例

### Requirement: 必须为常用测试场景创建 Fixtures

系统 SHALL 为以下常用测试场景创建标准化的 Fixtures：

**核心场景**：
1. **Model 数据**：不同供应商的模型配置
2. **Chat 数据**：聊天消息、历史记录、对话状态
3. **Redux Store**：预配置的 store 状态
4. **User 交互**：用户输入、点击、导航事件

#### Scenario: Model Fixtures 覆盖所有供应商
- **WHEN** 测试不同供应商的模型
- **THEN** Fixtures SHALL 提供 `createDeepSeekModel`, `createKimiModel`, `createZhipuModel` 等工厂函数
- **AND** 每个 Fixture SHALL 包含有效的默认值（API key、model key 等）
- **AND** Fixture SHALL 支持自定义（如 `isEnable: false`, `remark: '测试模型'`）

#### Scenario: Chat Fixtures 覆盖消息类型
- **WHEN** 测试聊天相关功能
- **THEN** Fixtures SHALL 提供 `createUserMessage`, `createAssistantMessage`, `createSystemMessage` 等工厂函数
- **AND** 消息 Fixture SHALL 包含推理内容（`reasoningContent`）的支持
- **AND** Fixture SHALL 支持添加元数据（`usage`, `raw` 等）

#### Scenario: Redux Store Fixtures 覆盖 Slice 状态
- **WHEN** 测试 Redux 相关功能
- **THEN** Fixtures SHALL 提供 `createTestStore` 工厂函数
- **AND** 函数 SHALL 接受 `preloadedState` 参数初始化状态
- **AND** 函数 SHALL 自动配置中间件（saveChatListMiddleware, saveModelsMiddleware 等）

#### Scenario: 用户交互事件 Fixtures
- **WHEN** 测试 UI 交互
- **THEN** Fixtures SHALL 提供 `createClickEvent`, `createInputEvent`, `createSubmitEvent` 等工厂函数
- **AND** 事件 SHALL 包含正确的属性（如 `target.value`, `preventDefault` Mock）

### Requirement: Fixtures 必须支持数据变体（Variants）

系统 SHALL 为常用场景提供数据变体，减少测试中的重复配置。

**变体类型**：
- **最小化变体**：只包含必需字段，用于快速原型
- **完整变体**：包含所有字段，用于全面测试
- **边界条件变体**：空数组、超长字符串、特殊字符等

#### Scenario: Model Fixtures 提供不同配置变体
- **WHEN** 测试模型的边界条件
- **THEN** Fixtures SHALL 提供如下变体：
  - `createMinimalModel()`: 只包含 id, providerKey, modelKey
  - `createModelWithCustomApi()`: 包含自定义 API 地址
  - `createDisabledModel()`: `isEnable: false`
  - `createModelWithLongRemark()`: remark 超过 100 字符

#### Scenario: Chat Fixtures 提供不同状态变体
- **WHEN** 测试聊天的不同状态
- **THEN** Fixtures SHALL 提供如下变体：
  - `createEmptyChat()`: 聊天列表为空
  - `createChatWithLongHistory()`: 包含 50+ 条消息
  - `createChatWithStreamingResponse()`: 包含流式响应的消息
  - `createChatWithError()`: 包含错误状态的消息

### Requirement: Fixtures 必须集成到测试辅助函数中

系统 SHALL 将 Fixtures 集成到测试辅助函数（如 `renderWithProviders`, `createTestStore`）中，提供默认数据。

**集成方式**：
- 测试辅助函数使用 Fixtures 作为默认参数
- 测试可以选择性地覆盖部分数据
- 减少测试代码中的样板代码

#### Scenario: renderWithProviders 使用 Fixtures 提供默认状态
- **WHEN** 使用 `renderWithProviders` 渲染组件
- **THEN** 函数 SHALL 使用 Fixtures 提供默认的 Redux store 状态
- **AND** 测试可以只覆盖需要测试的状态片断

**示例**：
```typescript
// ✅ 正确：使用 Fixtures 作为默认值
function renderWithProviders(
  component: React.ReactElement,
  options: {
    store?: Partial<RootState>;  // 覆盖默认状态
    user?: User;                 // 覆盖默认用户
  } = {}
) {
  const store = createTestStore({
    models: defaultModelsState(),  // 使用 Fixture
    chat: defaultChatState(),      // 使用 Fixture
    ...options.store,
  });
  // ...
}
```

#### Scenario: createTestStore 使用 Fixtures 初始化状态
- **WHEN** 创建测试用的 Redux store
- **THEN** 函数 SHALL 使用 Fixtures 填充未提供的状态片断
- **AND** 测试只需提供需要测试的状态

### Requirement: Fixtures 必须支持数据验证

系统 SHALL 使用 Zod 或类似库验证 Fixtures 生成的数据结构，确保符合生产代码的类型定义。

**验证策略**：
- 每个 Fixture 工厂函数内部使用 Zod schema 验证生成的数据
- 如果数据不符合 schema，抛出清晰的错误信息
- 在开发模式下启用验证，生产测试中禁用以提高性能

#### Scenario: Fixtures 数据结构验证
- **WHEN** 调用 Fixture 工厂函数
- **THEN** 函数 SHALL 使用 Zod schema 验证生成的数据
- **AND** 如果验证失败，函数 SHALL 抛出 `FixtureValidationError`
- **AND** 错误信息 SHALL 指出哪个字段不符合要求

**示例**：
```typescript
import { z } from 'zod';

const ModelSchema = z.object({
  id: z.string().min(1),
  providerKey: z.nativeEnum(ModelProviderKeyEnum),
  modelKey: z.string().min(1),
  // ...
});

export const createMockModel = (overrides?: Partial<Model>): Model => {
  const model = {
    id: 'test-model-id',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    modelKey: 'deepseek-chat',
    ...overrides,
  };

  // 验证数据结构
  const result = ModelSchema.safeParse(model);
  if (!result.success) {
    throw new FixtureValidationError('Invalid Model data', result.error);
  }

  return model;
};
```

### Requirement: Fixtures 必须有完整的文档和示例

系统 SHALL 为每个 Fixture 提供完整的文档，包括用途、参数、返回值、使用示例。

**文档位置**：
- `src/__test__/fixtures/README.md`: 总体介绍
- 每个 Fixture 文件中的 JSDoc: 详细说明

#### Scenario: Fixtures README 提供快速入门
- **WHEN** 新开发者需要使用 Fixtures
- **THEN** README SHALL 包含：
  - Fixtures 的用途和优势
  - 常用场景和示例代码
  - 完整的 Fixture 工厂函数列表
  - 最佳实践和注意事项

#### Scenario: 每个 Fixture 有 JSDoc 注释
- **WHEN** 开发者使用 Fixture 工厂函数
- **THEN** IDE SHALL 显示函数的 JSDoc 注释
- **AND** 注释 SHALL 包含：
  - 函数用途
  - 参数说明（类型、是否必需）
  - 返回值类型
  - 使用示例

**示例**：
```typescript
/**
 * 创建 DeepSeek 供应商的测试数据
 *
 * @param overrides - 要覆盖的字段（如 API 地址、模型列表）
 * @returns DeepSeek 供应商数据对象
 *
 * @example
 * ```typescript
 * const provider = createDeepSeekProvider({
 *   api: 'https://custom.api.com',
 *   models: [{ modelKey: 'custom-model', modelName: 'Custom' }]
 * });
 * ```
 */
export const createDeepSeekProvider = (
  overrides?: Partial<RemoteProviderData>
): RemoteProviderData => { ... }
```

### Requirement: Fixtures 使用率必须达到 80%

系统 SHALL 确保 Fixtures 覆盖 80% 的测试数据需求，减少测试中的手动数据构造。

**衡量标准**：
- 统计测试中使用 Fixture 的比例（目标：≥ 80%）
- 统计手动构造数据的测试数量（目标：≤ 20%）
- 定期审查未使用 Fixture 的测试，评估是否需要创建新 Fixture

#### Scenario: 定期审查 Fixtures 使用率
- **WHEN** 每个迭代结束时
- **THEN** 团队 SHALL 运行 `pnpm analyze:fixtures` 统计使用率
- **AND** 对于频繁手动构造的数据，评估创建新 Fixture
- **AND** 对于未使用的 Fixture，评估是否需要删除或改进

#### Scenario: 新测试优先使用 Fixtures
- **WHEN** 编写新的测试
- **THEN** 开发者 SHALL 首先检查现有 Fixtures 是否满足需求
- **AND** 如果满足，使用 Fixture 而非手动构造数据
- **AND** 如果不满足，考虑创建新 Fixture（而非在多个测试中重复构造）
