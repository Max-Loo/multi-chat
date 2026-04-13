# Spec: 类型安全的测试辅助工具

## Purpose

提供类型安全的测试辅助工具函数和接口，替代测试代码中通过 `as any` 访问内部状态或构造 Mock 对象的模式，确保测试代码在编译期即可捕获类型错误。

## Requirements

### Requirement: createTestRootState 工厂函数
系统 SHALL 提供 `createTestRootState(overrides?: Partial<RootState>)` 函数，返回包含所有 7 个 slice 默认值的完整 `RootState` 对象。未指定的 slice MUST 使用各 slice 的安全默认值（空数组、false、null 等）。

#### Scenario: 不传参数时返回完整默认状态
- **WHEN** 调用 `createTestRootState()` 不传参数
- **THEN** 返回包含所有 7 个 slice 的完整 RootState，每个 slice 均有合理默认值

#### Scenario: 传入部分覆盖时合并状态
- **WHEN** 调用 `createTestRootState({ chat: { chatList: [...], ... } })`
- **THEN** 返回的 RootState 中 chat slice 使用传入值，其余 slice 保持默认值

#### Scenario: 类型检查拒绝非法字段
- **WHEN** 传入包含拼写错误或不存在 slice key 的对象
- **THEN** TypeScript 编译期报错，不允许通过

### Requirement: createTypeSafeTestStore 工厂函数
系统 SHALL 提供 `createTypeSafeTestStore(preloadedState?, options?)` 函数，返回包含完整 7 个 reducer 映射和可选 preloadedState 的 Redux store，全程不使用 `as any`。函数 MUST 支持通过 `options.reducerOverrides` 替换特定 reducer（如 stub 掉 `modelProvider`），同时保持类型安全。

#### Scenario: 创建默认 store
- **WHEN** 调用 `createTypeSafeTestStore()` 不传参数
- **THEN** 返回包含所有 7 个 reducer 和默认 state 的 store

#### Scenario: 创建带预加载状态的 store
- **WHEN** 调用 `createTypeSafeTestStore({ models: { models: [...], loading: false, ... } })`
- **THEN** store 的初始 state 中 models slice 使用传入值，其余使用默认值

#### Scenario: store 类型与 RootState 一致
- **WHEN** 从 store 获取 `store.getState()`
- **THEN** 返回值类型为 `RootState`，所有字段均可类型安全访问

#### Scenario: 自定义替换特定 reducer
- **WHEN** 调用 `createTypeSafeTestStore(undefined, { reducerOverrides: { modelProvider: (state) => state } })`
- **THEN** store 中 `modelProvider` 使用 stub reducer（始终返回原状态），其余 6 个 reducer 使用真实实现

#### Scenario: reducerOverrides 类型检查拒绝非法 key 或类型不匹配
- **WHEN** 传入 `reducerOverrides` 包含不存在的 slice key 或 reducer 类型不兼容
- **THEN** TypeScript 编译期报错，不允许通过

### Requirement: AIError 扩展错误类型
系统 SHALL 在测试 Mock 工具中提供 `AIError` 接口和 `createAIError` 工厂函数，替代运行时通过 `as any` 给 Error 对象注入额外属性的模式。

#### Scenario: 创建带 statusCode 的 AI 错误
- **WHEN** 调用 `createMockAISDKNetworkError('Network error', 500)`
- **THEN** 返回的错误对象类型为 `AIError`，包含 `statusCode: 500` 和 `response: { status: 500, ... }` 属性，无需 `as any`

#### Scenario: 创建带 code 的超时错误
- **WHEN** 调用 `createMockTimeoutError()`
- **THEN** 返回的错误对象类型为 `AIError`，包含 `code: 'ETIMEDOUT'` 属性，无需 `as any`

### Requirement: HighlightLanguageManager 测试访问器
`HighlightLanguageManager` 类 SHALL 提供 `@internal` 标注的 getter 方法，供测试安全访问内部状态，替代 `(manager as any).xxx` 模式。

#### Scenario: 访问已加载语言列表
- **WHEN** 测试代码调用 `manager.testInternals.loadedLanguages`
- **THEN** 返回 `Set<string>` 类型的已加载语言集合，无需 `as any`

#### Scenario: 访问解析别名方法
- **WHEN** 测试代码调用 `manager.testInternals.resolveAlias('js')`
- **THEN** 返回解析后的语言名称，类型为 `string`，无需 `as any`

#### Scenario: 访问加载中的 Promise 映射
- **WHEN** 测试代码访问 `manager.testInternals.loadingPromises`
- **THEN** 返回 `Map<string, Promise<boolean>>` 类型，无需 `as any`

### Requirement: 各 Slice 默认状态工厂函数
系统 SHALL 为每个 Redux slice 提供独立的默认状态工厂函数：`createChatSliceState()`、`createChatPageSliceState()`、`createAppConfigSliceState()`、`createModelProviderSliceState()`、`createSettingPageSliceState()`、`createModelPageSliceState()`。这些函数 MUST 返回类型安全的 slice state，支持 `overrides` 参数。

#### Scenario: 创建 Chat slice 默认状态
- **WHEN** 调用 `createChatSliceState()`
- **THEN** 返回 `ChatSliceState` 类型的默认值（空 chatList、null selectedChatId 等）

#### Scenario: 创建带覆盖的 slice 状态
- **WHEN** 调用 `createChatSliceState({ chatList: [mockChat] })`
- **THEN** 返回 `ChatSliceState`，chatList 为 `[mockChat]`，其余字段保持默认
