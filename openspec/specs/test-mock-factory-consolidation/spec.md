## Purpose

通过共享 mock 工厂函数消除测试文件中的重复 mock 定义，统一 mock 创建模式。

## Requirements

### Requirement: tauriCompat mock 必须通过共享工厂函数创建

集成测试中 `vi.mock('@/utils/tauriCompat')` MUST 使用共享的 `createTauriCompatModuleMock(storeMap?)` 工厂函数创建 mock 对象，MUST NOT 在测试文件中手写 `isTauri`、`createLazyStore`、`keyring` 的 mock 定义。

#### Scenario: model-config 集成测试使用共享工厂

- **WHEN** `model-config.integration.test.ts` 需要 mock `@/utils/tauriCompat`
- **THEN** MUST 调用 `globalThis.__createTauriCompatModuleMock(memoryStore)` 获取完整 mock 对象，MUST NOT 手写 `keyring` 的 5 个方法 mock

#### Scenario: settings-change 集成测试使用共享工厂

- **WHEN** `settings-change.integration.test.ts` 需要 mock `@/utils/tauriCompat`
- **THEN** MUST 调用 `globalThis.__createTauriCompatModuleMock()` 获取默认 mock 对象

### Requirement: useResponsive mock 必须通过共享工厂函数创建

测试文件中 `vi.mock('@/hooks/useResponsive')` MUST 使用 `createResponsiveMock(overrides?)` 工厂函数创建可变的 mock 状态对象，MUST NOT 在每个测试文件中重复定义完整的字段结构。此要求适用于模式可统一的文件，不适用于有特殊需求的文件（responsive-layout-switching、PageSkeleton、ToasterWrapper、ChatSidebar）。

#### Scenario: 7 个测试文件统一使用 createResponsiveMock

- **WHEN** 以下测试文件需要 mock `useResponsive` hook：Layout.test.tsx、BottomNav.test.tsx、SettingPage.test.tsx、ToolsBar.test.tsx、drawer-state.integration.test.tsx、bottom-nav.integration.test.tsx、chat-button-render-count.test.tsx
- **THEN** MUST 使用 `vi.hoisted(() => globalThis.__createResponsiveMock())` 创建可变状态对象，MUST NOT 手写完整的字段定义

#### Scenario: createResponsiveMock 支持自定义初始值

- **WHEN** 调用 `createResponsiveMock({ isMobile: true })`
- **THEN** 返回的对象 MUST 合并自定义值，未指定的字段使用默认值（`layoutMode: 'desktop'`, `isMobile: false` 等）

### Requirement: toast mock 必须通过共享工厂函数创建

测试文件中 `vi.mock('@/services/toast')` MUST 使用 `createToastQueueModuleMock()` 工厂函数创建模块 mock 对象，MUST NOT 手写 `toastQueue` 的方法 mock 定义。

#### Scenario: 5 个测试文件统一使用 createToastQueueModuleMock

- **WHEN** 测试文件需要 mock `@/services/toast`
- **THEN** MUST 使用 `vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock())`，MUST NOT 手写 `success`、`error`、`warning` 等方法的 `vi.fn()` 定义

### Requirement: ChatPanel 测试必须使用 renderChatPanel 辅助函数

`ChatPanel.test.tsx` 中重复的 store 创建 + render 模式 MUST 提取为 `renderChatPanel(modelCount, overrides?)` 辅助函数。

#### Scenario: ChatPanel 测试使用共享渲染辅助函数

- **WHEN** `ChatPanel.test.tsx` 的测试用例需要渲染 ChatPanel 组件
- **THEN** MUST 调用 `renderChatPanel(modelCount, overrides?)` 辅助函数，MUST NOT 在每个测试中重复 `createMockChatWithModels` → `createStore` → `renderWithProviders` 三行模式

### Requirement: crypto-storage 重复加密测试必须合并

`crypto-storage.test.ts` 中两个 100 次加密测试 MUST 合并为一个测试用例，在同一个循环中同时验证密文唯一性和 nonce 唯一性。

#### Scenario: 合并后的加密测试验证所有唯一性

- **WHEN** `crypto-storage.test.ts` 运行并发加密唯一性测试
- **THEN** MUST 在一个 100 次循环中同时验证密文唯一性和 nonce 唯一性，MUST NOT 存在两个独立但操作相同的测试
