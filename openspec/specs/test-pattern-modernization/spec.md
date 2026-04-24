## Purpose

将测试代码中的过时模式（真实定时器等待、手动 Provider 包装、编号前缀命名等）统一迁移为现代 Vitest 最佳实践。

## Requirements

### Requirement: 真实 setTimeout 替换为 fakeTimers

包含真实 `setTimeout` 等待的 10 个测试文件必须（MUST）迁移为 `vi.useFakeTimers()` + `vi.advanceTimersByTime()` 模式。`vi.useFakeTimers()` 应在包含真实等待的最小 `describe` 块内启用。

#### Scenario: ProviderCardDetails 使用 fakeTimers 替代真实等待

- **WHEN** `ProviderCardDetails.test.tsx` 中的测试需要等待异步操作
- **THEN** 使用 `vi.advanceTimersByTime(200)` 替代 `setTimeout(..., 200)` 等真实等待

#### Scenario: InitializationManager 使用 fakeTimers 替代真实等待

- **WHEN** `InitializationManager.test.ts` 中存在 `setTimeout(..., 10)` 调用
- **THEN** 使用 `vi.advanceTimersByTime(10)` 替代，在相关 `describe` 块内启用 `vi.useFakeTimers()`

#### Scenario: 所有 10 个文件完成迁移

- **WHEN** 扫描报告中列出的 10 个文件
- **THEN** 不包含任何用于测试等待的真实 `setTimeout` 或 `setInterval` 调用（源代码中的正常异步逻辑除外）

### Requirement: 手动 Provider 包装迁移到 renderWithProviders

剩余 9 个手动使用 `<Provider>` + `<BrowserRouter>` 包装的测试文件必须（MUST）迁移到 `renderWithProviders`。

#### Scenario: 迁移后使用统一渲染函数

- **WHEN** `toast-system.integration.test.tsx` 等文件渲染组件
- **THEN** 使用 `renderWithProviders(component, { preloadedState, route })` 而非手动组合 `<Provider store={store}><BrowserRouter>...</BrowserRouter></Provider>`

#### Scenario: renderWithProviders 支持所有必要参数

- **WHEN** `renderWithProviders` 的调用者需要传入自定义 store、路由路径
- **THEN** `renderWithProviders` 必须（MUST）接受 `preloadedState` 和 `route` 参数

### Requirement: 统一测试命名风格

测试名称必须（MUST）使用纯描述性简体中文，不得（MUST NOT）包含编号前缀（如 `4.1.1`、`5.1`、`4.2`）。测试名称不得（MUST NOT）混合使用中英文。

#### Scenario: ChatPanel 测试去除编号前缀

- **WHEN** `ChatPanel.test.tsx` 中的 `describe('4.1.1 测试单模型聊天面板渲染')`
- **THEN** 改为 `describe('测试单模型聊天面板渲染')`

#### Scenario: 英文测试名称改为中文

- **WHEN** `test-indexeddb.test.ts` 中存在 `it('should open database')`
- **THEN** 改为 `it('应该打开数据库')`
