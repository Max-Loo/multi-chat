## ADDED Requirements

### Requirement: window.location 替换必须可恢复

测试文件中替换 `window.location` 的操作必须（MUST）确保在测试结束后恢复原始值。首选方案为 `vi.spyOn(window.location, 'reload')`（Vitest 自动管理恢复）。若 `vi.spyOn` 在当前 jsdom 环境中不可用（`window.location` 属性不可配置），必须（MUST）使用 fallback 方案：在 `beforeEach` 中保存原始值并用 `vi.fn()` 替换，在 `afterEach` 中恢复。不得（MUST NOT）使用文件顶层的 `Object.defineProperty` 而无恢复机制。

#### Scenario: FatalErrorScreen 安全替换 window.location

- **WHEN** `FatalErrorScreen.test.tsx` 需要监控 `window.location.reload` 的调用
- **THEN** 在 `beforeEach` 中使用以下方案之一：
  - 首选：`vi.spyOn(window.location, 'reload')`（自动恢复）
  - Fallback：保存 `const originalLocation = window.location`，使用 `Object.defineProperty` 替换，在 `afterEach` 中恢复原始值

#### Scenario: NoProvidersAvailable 在 afterEach 中恢复

- **WHEN** `NoProvidersAvailable.test.tsx` 在 `beforeEach` 中替换 `window.location`
- **THEN** 在 `afterEach` 中恢复原始 `window.location` 对象（使用 fallback 方案时），或使用 `vi.spyOn` 自动恢复

#### Scenario: 替换后测试不泄漏状态

- **WHEN** 上述两个测试文件执行完毕
- **THEN** `window.location` 恢复为 jsdom 的原始实现，后续测试不受影响
