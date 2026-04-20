## MODIFIED Requirements

### Requirement: 集成测试验证渲染结果

名为"集成测试"的测试文件 MUST 验证组件渲染结果（DOM 断言），MUST NOT 仅验证 Redux store state。

#### Scenario: drawer-state 验证 DOM 渲染

- **WHEN** `drawer-state.integration.test.tsx` 渲染 `renderChatPage(store)` 后验证抽屉状态
- **THEN** SHALL 包含 DOM 断言（如侧边栏在抽屉打开时出现在 DOM 中，关闭时消失），MUST NOT 仅断言 `store.getState()` 的返回值

#### Scenario: 纯 reducer 测试移到单元测试

- **WHEN** 集成测试中的某些用例仅验证 reducer 逻辑（不涉及渲染）
- **THEN** 这些用例 SHALL 被移到对应的 slice 单元测试文件中
