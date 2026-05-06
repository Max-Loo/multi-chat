## Context

`KeyManagementSetting` 和 `useResetDataDialog` 已有基础测试文件，但覆盖不完整。审查报告指出以下关键缺口：

- **KeyManagementSetting**：缺少取消导出按钮测试、复制失败后对话框保持打开、重置完整集成流程（确认 → `resetAllData` → `window.location.reload`）
- **useResetDataDialog**：缺少 `window.location.reload` 调用验证（成功时调用、失败时不调用）、并发双击防护

现有 mock 基础设施完善（`__createI18nMockReturn`、`__createToastQueueModuleMock`、`renderWithProviders`），可直接复用。

## Goals / Non-Goals

**Goals:**

- 补充密钥导出完整用户流程测试（导出 → 复制 → 关闭/失败）
- 补充数据重置完整集成测试（点击重置 → 确认 → 验证 `resetAllData` 和 `window.location.reload`）
- 补充 `useResetDataDialog` 的 `window.location.reload` 调用验证
- 补充并发双击防护测试

**Non-Goals:**

- 不重构现有测试结构
- 不修改源代码
- 不涉及 UI 快照测试

## Decisions

### D1: 在现有测试文件中补充用例，不拆分新文件

现有测试文件已有良好的结构（`describe` 分组、BDD 命名），在同一文件中补充用例保持一致性，避免文件碎片化。

### D2: `window.location.reload` 通过 `Object.defineProperty` mock

与现有 `beforeEach` 中的模式一致，通过 `writable: true` 覆盖 `window.location`。

### D3: 并发双击通过 UI 交互验证

通过 `renderResetDialog` 渲染对话框，使用 `fireEvent.click` 模拟用户快速连续点击确认按钮。第一次点击触发 `handleConfirmReset` 后按钮变为 disabled，第二次点击落在 disabled 按钮上不会触发 onClick，从而验证 `resetAllData` 仅被调用一次。

**注意**：不能通过直接调用 `handleConfirmReset` 两次来测试，因为函数内部无 re-entry guard（`isResetting` 的保护仅在 UI 层 `disabled` 属性上生效），直接调用会导致 `resetAllData` 被调用两次。

## Risks / Trade-offs

- **[风险]** `window.location.reload` mock 可能与未来 React Router 版本冲突 → 仅在 `beforeEach` 中覆盖，`afterEach` 恢复
- **[风险]** 并发双击测试依赖 `fireEvent.click` 对 disabled 按钮的阻断行为 → `fireEvent.click` 在按钮 disabled 时不触发 onClick，与浏览器行为一致
