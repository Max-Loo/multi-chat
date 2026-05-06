# Capability: a11y-utils

## Purpose

提供无障碍相关的工具函数，用于复用常见的无障碍交互模式，避免在组件中内联重复的无障碍逻辑。

## Requirements

### Requirement: 键盘激活处理器

系统 SHALL 提供 `handleActivationKeyDown(callback: () => void)` 纯函数，返回一个 `KeyboardEventHandler`，当用户按下 Enter 或 Space 键时调用传入的回调并 `preventDefault()`。

#### Scenario: Enter 键触发回调
- **WHEN** 用户在可交互元素上按下 Enter 键
- **THEN** 系统 SHALL 调用传入的 callback 函数
- **AND** 系统 SHALL 调用 `event.preventDefault()` 阻止默认行为

#### Scenario: Space 键触发回调
- **WHEN** 用户在可交互元素上按下 Space 键
- **THEN** 系统 SHALL 调用传入的 callback 函数
- **AND** 系统 SHALL 调用 `event.preventDefault()` 阻止默认行为

#### Scenario: 其他按键不触发回调
- **WHEN** 用户按下 Tab、Escape 或其他非 Enter/Space 键
- **THEN** 系统 SHALL NOT 调用回调函数
- **AND** 系统 SHALL NOT 调用 `preventDefault()`
