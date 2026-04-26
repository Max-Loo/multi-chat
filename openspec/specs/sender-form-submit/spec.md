# Capability: sender-form-submit

## Purpose

Sender 组件表单提交行为控制，确保表单交互不会触发浏览器默认的页面刷新行为。

## Requirements

### Requirement: Sender 表单禁止浏览器默认提交行为

Sender 组件的 `<form>` 元素 SHALL 在 `onSubmit` 事件中调用 `preventDefault()`，阻止浏览器默认的表单提交行为（页面刷新）。

#### Scenario: 点击发送按钮不触发页面刷新
- **WHEN** 用户在 Sender 表单内点击发送按钮
- **THEN** 表单的 `onSubmit` 事件处理器调用 `e.preventDefault()`，浏览器不执行页面刷新，仅执行 `sendMessage` 逻辑

#### Scenario: 在输入框按 Enter 发送不触发页面刷新
- **WHEN** 用户在 Textarea 中按下 Enter 键触发发送
- **THEN** 表单不执行默认提交行为，仅执行 `sendMessage` 逻辑
