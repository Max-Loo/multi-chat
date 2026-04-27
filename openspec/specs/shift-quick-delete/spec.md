## ADDED Requirements

### Requirement: Shift 键状态追踪
ChatButton 组件 SHALL 通过 document 级别的 keydown/keyup 事件监听追踪 Shift 键的按下状态，并在组件卸载时清理事件监听器。

#### Scenario: 按下 Shift 键
- **WHEN** 用户按下 Shift 键
- **THEN** 组件内部 `isShiftDown` 状态变为 true

#### Scenario: 松开 Shift 键
- **WHEN** 用户松开 Shift 键
- **THEN** 组件内部 `isShiftDown` 状态变为 false

#### Scenario: 组件卸载时清理
- **WHEN** ChatButton 组件卸载
- **THEN** document 上的 keydown/keyup 事件监听器被移除

### Requirement: 鼠标悬停状态追踪
ChatButton 组件 SHALL 通过 onMouseEnter/onMouseLeave 追踪鼠标是否悬停在按钮区域。

#### Scenario: 鼠标进入按钮区域
- **WHEN** 鼠标移入 ChatButton 区域
- **THEN** 组件内部 `isHovering` 状态变为 true

#### Scenario: 鼠标离开按钮区域
- **WHEN** 鼠标移出 ChatButton 区域
- **THEN** 组件内部 `isHovering` 状态变为 false

### Requirement: 快捷删除按钮的条件渲染
当 `isShiftDown` 和 `isHovering` 同时为 true 时，ChatButton SHALL 将 DropdownMenu（⋯ 按钮）替换为红色背景、白色垃圾桶图标的删除按钮。两个条件中任一不满足时，SHALL 恢复显示原始 DropdownMenu。

#### Scenario: 先按 Shift 再悬停
- **WHEN** 用户按住 Shift 键，然后将鼠标移到 ChatButton 上
- **THEN** ⋯ 按钮变为红色背景、白色垃圾桶图标的删除按钮

#### Scenario: 先悬停再按 Shift
- **WHEN** 鼠标已在 ChatButton 上，用户按下 Shift 键
- **THEN** ⋯ 按钮变为红色背景、白色垃圾桶图标的删除按钮

#### Scenario: 松开 Shift 键恢复
- **WHEN** 快捷删除按钮正在显示，用户松开 Shift 键
- **THEN** 恢复显示原始 DropdownMenu（⋯ 按钮）

#### Scenario: 鼠标移出恢复
- **WHEN** 快捷删除按钮正在显示，鼠标移出按钮区域
- **THEN** 恢复显示原始 DropdownMenu（⋯ 按钮）

### Requirement: 快捷删除按钮的样式
快捷删除按钮 SHALL 使用 `variant="destructive"` 的 Button 组件和 Trash2 图标（白色），按钮尺寸 SHALL 跟随 `isNormalSize` 响应式逻辑（desktop/mobile 为 h-8 w-8，其他为 h-7 w-7）。

#### Scenario: 桌面/移动端尺寸
- **WHEN** layoutMode 为 desktop 或 mobile
- **THEN** 快捷删除按钮尺寸为 h-8 w-8

#### Scenario: 紧凑布局尺寸
- **WHEN** layoutMode 非 desktop 且非 mobile
- **THEN** 快捷删除按钮尺寸为 h-7 w-7

### Requirement: 快捷删除按钮的无障碍
快捷删除按钮 SHALL 提供 `aria-label` 属性，使用国际化文本描述删除操作。

#### Scenario: 屏幕阅读器识别
- **WHEN** 快捷删除按钮渲染
- **THEN** 按钮带有 aria-label，内容为国际化的删除提示文本

### Requirement: 快捷删除的直接执行
点击快捷删除按钮 SHALL 直接执行删除操作（dispatch `deleteChat` + 成功 toast），不弹出确认对话框。如果删除的是当前选中的聊天，SHALL 调用 `clearChatIdParam()` 清除 URL 中的 chatId 参数。

#### Scenario: 删除非选中聊天
- **WHEN** 用户点击快捷删除按钮，且该聊天不是当前选中状态
- **THEN** 直接 dispatch `deleteChat`，显示成功 toast，不弹出确认对话框

#### Scenario: 删除当前选中聊天
- **WHEN** 用户点击快捷删除按钮，且该聊天是当前选中状态
- **THEN** 直接 dispatch `deleteChat`，显示成功 toast，调用 `clearChatIdParam()`

#### Scenario: 删除失败
- **WHEN** 快捷删除操作执行失败
- **THEN** 显示错误 toast
