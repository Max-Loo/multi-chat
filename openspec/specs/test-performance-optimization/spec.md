## ADDED Requirements

### Requirement: 使用 fake timers 替代真实等待
测试中需要等待异步操作的代码 SHALL 使用 `vi.useFakeTimers()` + `vi.advanceTimersByTime()` 替代真实 `setTimeout` 等待。

#### Scenario: useBasicModelTable.test.tsx 不使用真实等待
- **WHEN** 查看 `useBasicModelTable.test.tsx` 中的等待代码
- **THEN** SHALL NOT 包含 `await new Promise(resolve => setTimeout(resolve, 600))` 或类似的真实等待

#### Scenario: ChatSidebar.test.tsx 不使用真实等待
- **WHEN** 查看 `ChatSidebar.test.tsx` 中的等待代码
- **THEN** SHALL NOT 包含 `await new Promise(resolve => setTimeout(resolve, 300))` 或类似的真实等待

#### Scenario: fake timers 测试隔离
- **WHEN** 使用 fake timers 的测试执行完毕
- **THEN** SHALL 在 afterEach 中恢复真实 timers，确保不影响其他测试
