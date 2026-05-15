## ADDED Requirements

### Requirement: 重命名完整流程测试
ChatButton 的测试 SHALL 覆盖从打开菜单到完成重命名的完整交互流程。

#### Scenario: 打开菜单并点击重命名进入编辑模式
- **WHEN** 用户点击 DropdownMenu 的 "更多操作" 按钮
- **AND** 从菜单中点击重命名选项
- **THEN** 组件 SHALL 进入重命名编辑模式
- **AND** 显示 Input 输入框（预填充当前名称）、确认按钮和取消按钮

#### Scenario: 输入新名称并确认重命名
- **WHEN** 组件处于重命名编辑模式
- **AND** 用户修改输入框内容为新名称
- **AND** 点击确认按钮
- **THEN** dispatch `editChatName` action，payload 包含 chatId 和新名称
- **AND** 调用 `toastQueue.success` 显示成功提示
- **AND** 退出编辑模式

#### Scenario: 取消重命名恢复原始状态
- **WHEN** 组件处于重命名编辑模式
- **AND** 用户点击取消按钮
- **THEN** 组件 SHALL 退出编辑模式
- **AND** 不触发任何 dispatch

#### Scenario: 确认按钮在输入为空时禁用
- **WHEN** 组件处于重命名编辑模式
- **AND** 输入框内容为空白
- **THEN** 确认按钮 SHALL 处于 disabled 状态

### Requirement: 删除确认对话框测试
ChatButton 的测试 SHALL 覆盖删除操作的确认对话框触发和执行逻辑。

#### Scenario: 点击删除触发确认对话框
- **WHEN** 用户从 DropdownMenu 中点击删除选项
- **THEN** `useConfirm().modal.warning` SHALL 被调用
- **AND** 对话框标题包含聊天名称
- **AND** 对话框包含 `onOk` 回调

#### Scenario: 确认删除执行 dispatch 和 toast
- **WHEN** 用户确认删除（调用 `onOk` 回调）
- **THEN** dispatch `deleteChat` action
- **AND** 调用 `toastQueue.success` 显示删除成功提示

#### Scenario: 删除当前选中聊天时清除 URL 参数
- **WHEN** 删除的聊天为当前选中状态（`isSelected` 为 true）
- **AND** 用户确认删除
- **THEN** `clearChatIdParam` SHALL 被调用

#### Scenario: 确认删除失败时显示错误提示
- **WHEN** 用户确认删除（调用 `onOk` 回调）
- **AND** `dispatch deleteChat` 抛出异常
- **THEN** 调用 `toastQueue.error` 显示删除失败提示

### Requirement: Shift 快捷删除测试
ChatButton 的测试 SHALL 覆盖 Shift+Hover 条件下快捷删除按钮的渲染和执行逻辑。

#### Scenario: Shift+Hover 时渲染快捷删除按钮
- **WHEN** Shift 键处于按下状态
- **AND** 鼠标悬停在 ChatButton 上
- **THEN** DropdownMenu 被 `destructive` variant 的删除按钮替代

#### Scenario: 点击快捷删除直接执行不弹确认
- **WHEN** 快捷删除按钮可见
- **AND** 用户点击该按钮
- **THEN** dispatch `deleteChat` action
- **AND** 不调用 `modal.warning`（跳过确认）
- **AND** 调用 `toastQueue.success`

#### Scenario: Shift 松开后恢复原始菜单
- **WHEN** 快捷删除按钮正在显示
- **AND** 用户松开 Shift 键
- **THEN** 恢复显示 DropdownMenu

#### Scenario: 快捷删除失败时显示错误提示
- **WHEN** 用户点击快捷删除按钮
- **AND** `dispatch deleteChat` 抛出异常
- **THEN** 调用 `toastQueue.error` 显示删除失败提示

### Requirement: 发送中状态禁用删除测试
ChatButton 的测试 SHALL 验证聊天发送中时删除按钮的禁用状态。

#### Scenario: 聊天发送中时删除菜单项禁用
- **WHEN** 聊天的 `sendingChatIds[chatId]` 为 true
- **THEN** DropdownMenu 中的删除菜单项 SHALL 处于 disabled 状态
