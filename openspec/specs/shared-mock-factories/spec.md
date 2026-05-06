## Purpose

统一管理测试中的 mock 工厂函数，消除各测试文件中重复的内联 mock 定义，通过 `setup.ts` 和 `helpers/mocks/` 提供共享的 mock 实现。

## Requirements

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

### Requirement: useAdaptiveScrollbar 共享 mock

`helpers/mocks/scrollbar.ts` 必须（MUST）提供 `createScrollbarMock` 工厂函数，通过 `setup.ts` 注册到 `globalThis.__createScrollbarMock`。所有需要 mock `useAdaptiveScrollbar` 的测试文件必须（MUST）使用此工厂，而非内联定义。

#### Scenario: 通过 globalThis 访问 scrollbar mock 工厂

- **WHEN** 测试文件中使用 `globalThis.__createScrollbarMock()`
- **THEN** 返回包含 `onScrollEvent`、`scrollbarClassname`、`isScrolling` 属性的 mock 对象

#### Scenario: 5 个消费者文件迁移到共享工厂

- **WHEN** `SettingPage.test.tsx`、`Detail.test.tsx`、`ChatSidebar.test.tsx`、`DetailScroll.test.tsx`、`GeneralSetting.test.tsx` 使用共享工厂
- **THEN** 不再包含 `vi.mock('@/hooks/useAdaptiveScrollbar', ...)` 的内联定义

### Requirement: markdown-it 和 dompurify 共享 mock

`helpers/mocks/markdown.ts` 和 `helpers/mocks/dompurify.ts` 必须（MUST）提供统一的 mock 实现。`ThinkingSection.test.tsx` 必须（MUST）使用这些共享 mock，替代其当前的内联定义。

`ChatBubble.test.tsx` 必须（MUST）保留其使用真实 `markdown-it` 和 `DOMPurify` 库的方案，因为其测试验证真实的 HTML 渲染结果（`<strong>`、`<code>`、`<h1>` 标签生成和 XSS 清理），共享 mock 的正则替换无法覆盖这些 markdown 语法。

#### Scenario: 共享 markdown mock 处理基本转换和图片

- **WHEN** 共享 markdown mock 的 `render` 方法接收包含图片的 HTML 字符串
- **THEN** 返回包装在 `<p>` 标签中的结果，并正确处理 `onerror`/`onload` 属性

#### Scenario: 共享 dompurify mock 处理 XSS 清理

- **WHEN** 共享 dompurify mock 的 `sanitize` 方法接收包含 `onerror`/`onload` 事件处理器的 HTML
- **THEN** 移除这些事件处理器，保留其他 HTML 结构

#### Scenario: ThinkingSection 迁移到共享 mock

- **WHEN** `ThinkingSection.test.tsx` 移除其内联的 `vi.mock('markdown-it', ...)` 和 `vi.mock('dompurify', ...)`
- **THEN** 使用 `helpers/mocks/markdown.ts` 和 `helpers/mocks/dompurify.ts` 提供的共享 mock

#### Scenario: ChatBubble 保留真实库

- **WHEN** 扫描 `ChatBubble.test.tsx`
- **THEN** 不包含对 `markdown-it` 或 `dompurify` 的 `vi.mock()` 调用，继续使用真实库进行渲染测试

### Requirement: skeleton 组件全局 mock

`setup.ts` 必须（MUST）包含 `vi.mock('@/components/ui/skeleton', ...)` 全局 mock。`SkeletonMessage.test.tsx`、`SkeletonList.test.tsx`、`PageSkeleton.test.tsx`、`PanelSkeleton.test.tsx` 不得（MUST NOT）包含各自的内联 skeleton mock。

#### Scenario: 全局 mock 提供统一的 skeleton 组件替身

- **WHEN** 任何测试渲染包含 skeleton 组件的代码
- **THEN** 使用 `setup.ts` 中的全局 mock，渲染带有 `data-testid="skeleton-item"` 的 div

### Requirement: storeUtils mock 去重

`keyVerification.test.ts`、`modelSlice.test.ts`、`app-loading.integration.test.ts` 必须（MUST）移除各自的 `vi.mock('@/store/storage/storeUtils', ...)` 声明，依赖 `setup.ts` 第 33 行的全局 mock。需要特定行为的测试必须（MUST）使用 `vi.mocked()` 覆盖返回值。

`modelStorage.test.ts` 必须（MUST）保留其本地 `vi.mock` 声明，因为它使用 `globalThis.__createMemoryStorageMock(storeMap)` 提供基于真实 Map 的持久化存储行为，与 `setup.ts` 全局 mock 的空桩函数有本质区别。

#### Scenario: 3 个文件依赖全局 storeUtils mock

- **WHEN** `keyVerification.test.ts`、`modelSlice.test.ts`、`app-loading.integration.test.ts` 移除本地 `vi.mock` 声明
- **THEN** 测试仍通过，因为 `setup.ts` 全局 mock 提供了相同的默认行为，且这些文件的测试用例均通过 `vi.mocked()` 覆盖返回值或不直接使用 storeUtils

#### Scenario: modelStorage.test.ts 保留本地 mock

- **WHEN** 扫描 `modelStorage.test.ts`
- **THEN** 保留其 `vi.mock('@/store/storage/storeUtils', ...)` 声明不变，因为集成测试需要真实的存储读写行为

### Requirement: highlight.js 共享 mock 工厂

`helpers/mocks/highlight.ts` 必须（MUST）导出 `createHighlightJsMock()` 工厂函数，通过 `setup/base.ts` 注册到 `globalThis.__createHighlightJsMock`。所有需要 mock `highlight.js` 的测试文件必须（MUST）使用此工厂，而非 `require()` 导入。

#### Scenario: 工厂函数返回完整的 highlight.js mock 对象

- **WHEN** `createHighlightJsMock()` 被调用
- **THEN** 返回包含 `default.highlight`、`default.highlightAuto`、`default.getLanguage` 方法的 mock 对象

#### Scenario: 工厂通过 globalThis 在 vi.mock 中使用

- **WHEN** 测试文件使用 `vi.mock('highlight.js', () => globalThis.__createHighlightJsMock())`
- **THEN** mock 正确注册且测试通过

#### Scenario: ChatBubble 和 ThinkingSection 使用共享工厂

- **WHEN** 扫描 `ChatBubble.test.tsx` 和 `ThinkingSection.test.tsx`
- **THEN** 不包含 `require('@/__test__/helpers/mocks/highlight')` 调用
- **AND** 使用 `globalThis.__createHighlightJsMock()` 替代

### Requirement: useResponsive mock 迁移到共享工厂

`ChatButton.test.tsx`、`PageSkeleton.test.tsx`、`responsive-layout-switching.integration.test.tsx` 必须（MUST）将其内联的 `useResponsive` mock 替换为 `globalThis.__createResponsiveMock()` 调用。

#### Scenario: 3 个文件使用共享工厂

- **WHEN** `ChatButton.test.tsx` 使用 `globalThis.__createResponsiveMock({ isDesktop: true })`
- **THEN** 不再包含 `vi.mock('@/hooks/useResponsive', () => ({ useResponsive: () => ({ ... }) }))` 的内联定义
