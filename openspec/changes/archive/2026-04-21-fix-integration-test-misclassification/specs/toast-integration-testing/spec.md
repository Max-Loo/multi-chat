## MODIFIED Requirements

### Requirement: Toast 系统集成测试验证用户可见行为

`toast-system.integration.test.tsx` SHALL 验证 Toast 消息是否渲染到 UI 上（用户可见行为），不 SHALL 使用 spy 验证内部方法调用。

#### Scenario: Toast 消息渲染到 DOM
- **WHEN** `toastQueue.success()` 被调用
- **THEN** SHALL 验证 Toast 消息文本出现在 DOM 中（如通过 `screen.findByText` 查找）

#### Scenario: mock sonner toast 函数为 DOM 渲染
- **WHEN** 测试需要验证 Toast 消息的用户可见行为
- **THEN** SHALL mock `sonner` 模块的 `toast` 函数，使其将消息文本渲染到 `data-testid="toast-container"` 容器中
- **AND** SHALL mock `@/components/ui/sonner` 的 Toaster 组件为渲染该容器的占位组件（因 Toaster 依赖 `next-themes` 的 `useTheme()`，无法在 happy-dom 中正常渲染）

#### Scenario: 不使用 spy 验证内部方法
- **WHEN** 测试验证 Toast 行为
- **THEN** SHALL NOT 使用 `vi.spyOn(toastQueue, 'xxx')` 验证内部方法调用
- **SHALL** 使用 `screen.findByText()` 或 `screen.getByText()` 验证消息出现在 DOM 中
