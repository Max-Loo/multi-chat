# Spec: Test Assertion Migration

本规格定义了测试断言从实现细节查询迁移到语义化查询的要求，以及消除条件守卫静默跳过的规范。

## Purpose

将测试中的 CSS 类选择器和条件守卫模式替换为语义化查询方法（getByRole、getByLabelText、getByTestId），提升测试的可维护性和可靠性。

## Requirements

### Requirement: CSS 类选择器断言迁移为语义化查询
测试文件 SHALL NOT 使用 `querySelector` 配合 Tailwind CSS 类名（如 `.flex.max-w-md.flex-col`）进行元素断言，SHALL 使用 `getByRole`、`getByLabelText`、`getByTestId` 等语义化查询。

#### Scenario: 替换 CSS 类选择器
- **WHEN** 测试需要定位 DOM 元素进行断言或交互
- **THEN** SHALL 优先使用 `screen.getByRole()` 或 `screen.getByLabelText()`
- **AND** 当无语义 role 可用时 SHALL 使用 `screen.getByTestId()`
- **AND** MUST NOT 使用 `container.querySelector('.tailwind-class')` 模式

#### Scenario: 组件添加 data-testid
- **WHEN** 测试需要定位无语义 role 的元素（布局容器、装饰性 div）
- **THEN** 源组件 SHALL 添加 `data-testid` 属性
- **AND** `data-testid` 命名 SHALL 使用 kebab-case 格式（如 `chat-panel-grid`）

---

### Requirement: dispatch-spy-filter 断言迁移为 Redux 状态验证

组件测试 SHALL NOT 通过 `dispatchSpy.mock.calls.filter` 按 action type 过滤来验证 dispatch 行为。当测试的 action 有可见的 Redux 状态变化时，SHALL 通过 `store.getState()` 验证最终状态。

#### Scenario: 重命名测试验证 Redux 状态
- **WHEN** 测试组件触发 `editChatName` action 后的断言
- **THEN** SHALL 使用 `waitFor(() => expect(store.getState().chat.chatMetaList[0].name).toBe('新名称'))` 验证最终状态
- **AND** MUST NOT 使用 `dispatchSpy.mock.calls.filter(call => call[0].type === 'chat/editChatName')` 模式

#### Scenario: 取消重命名验证无状态变化
- **WHEN** 测试取消重命名操作后的断言
- **THEN** SHALL 验证 `store.getState().chat.chatMetaList[0].name` 保持不变
- **AND** MUST NOT 通过 `dispatchSpy.mock.calls.filter` 验证"无 dispatch"

#### Scenario: 无可见 UI 变化的场景保留 dispatch spy
- **WHEN** 测试的 action 没有可见的 Redux 状态变化或 UI 变化（如删除操作标记 `isDeleted` 但组件自身不消失）
- **THEN** MAY 保留 `dispatchSpy.mock.calls.filter` 模式作为可行的验证方式

---

### Requirement: 消除条件守卫静默跳过
测试 SHALL NOT 使用 `if (element)` 守卫包裹断言和交互操作。当元素不存在时测试 SHALL 立即失败而非静默跳过。

#### Scenario: 使用 getBy 替代 querySelector + if 守卫
- **WHEN** 测试需要对某个元素执行交互和断言
- **THEN** SHALL 使用 `screen.getByRole()` 或 `screen.getByTestId()` 定位元素
- **AND** 这些方法在元素不存在时 SHALL 自动抛出错误导致测试失败
- **AND** MUST NOT 使用 `if (element) { fireEvent.click(element) }` 模式

#### Scenario: 允许元素不存在时的断言
- **WHEN** 测试意图验证元素确实不存在
- **THEN** SHALL 使用 `expect(screen.queryByRole(...)).not.toBeInTheDocument()`
- **AND** 此场景 MUST NOT 使用 if 守卫模式
