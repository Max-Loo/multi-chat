## MODIFIED Requirements

### Requirement: AI SDK provider mock 工厂函数

`helpers/mocks/aiSdk.ts` 必须（MUST）导出 `createMockAIProvider(providerName)` 工厂函数，用于生成 AI SDK provider mock 对象。`setup/mocks.ts` 中的 `@ai-sdk/deepseek`、`@ai-sdk/moonshotai`、`zhipu-ai-provider` 三个 `vi.mock()` 调用必须（MUST）从此模块导入此函数，而非内联定义。该函数必须（MUST）通过 `helpers/mocks/index.ts` 再次导出，供其他测试文件直接使用。

#### Scenario: 三个 provider mock 使用同一工厂

- **WHEN** `setup/mocks.ts` 中的 `@ai-sdk/deepseek`、`@ai-sdk/moonshotai`、`zhipu-ai-provider` 三个 `vi.mock()` 使用 `createMockAIProvider` 工厂
- **THEN** 每个 mock 仅包含 1 行工厂调用，`provider` 字段分别为 `'deepseek'`、`'moonshotai'`、`'zhipu'`

#### Scenario: 工厂函数生成的 mock 具备完整接口

- **WHEN** `createMockAIProvider('deepseek')` 被调用
- **THEN** 返回的对象必须（MUST）包含 `specificationVersion`、`supportsImageUrls`、`doStream`、`doGenerate` 等所有 AI SDK language model 必需属性

#### Scenario: 工厂函数可被测试文件直接导入

- **WHEN** 测试文件通过 `import { createMockAIProvider } from '@/__test__/helpers'` 导入
- **THEN** 必须（MUST）获得与 `setup/mocks.ts` 中使用的同一个工厂函数

### Requirement: streamText 默认 mock 必须复用 createMockStreamResult

`setup/mocks.ts` 中的 `vi.mock('ai')` 必须（MUST）使用 `helpers/mocks/aiSdk.ts` 导出的 `createMockStreamResult()`（无参调用）作为 `streamText` 的默认返回值，必须（MUST NOT）在 `setup/mocks.ts` 中内联定义重复的 `createDefaultMockStreamResult` 或 `createDefaultMockStream` 函数。

#### Scenario: vi.mock('ai') 使用 createMockStreamResult

- **WHEN** `setup/mocks.ts` 中定义 `vi.mock('ai')` 的 `streamText` mock
- **THEN** 必须（MUST）调用 `createMockStreamResult()`（从 `helpers/mocks/aiSdk.ts` 导入），不得（MUST NOT）使用本地内联函数

#### Scenario: 无参调用返回默认元数据

- **WHEN** `createMockStreamResult()` 无参调用
- **THEN** 返回的对象必须（MUST）包含 `finishReason: 'stop'`、`usage.inputTokens: 10`、`response.modelId: 'deepseek-chat'` 等默认元数据字段，且 `fullStream` 为空异步迭代器
