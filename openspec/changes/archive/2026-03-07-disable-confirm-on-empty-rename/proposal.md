## Why

在用户重命名聊天时，如果输入为空字符串直接提交，会导致聊天名称为空或无意义，降低用户体验。通过禁用确认按钮，可以在UI层面提供即时反馈，防止无效操作。

## What Changes

- 在 ChatButton 组件的重命名模式中添加输入验证逻辑
- 当输入框为空字符串时，禁用确认按钮（Check 按钮）
- 当输入框有内容时，启用确认按钮

## Capabilities

### New Capabilities
- `chat-rename-validation`: 聊天重命名输入验证功能，确保重命名操作的有效性

### Modified Capabilities
无

## Impact

**受影响的组件**：
- `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx`

**不影响的系统**：
- 后端 API（重命名接口保持不变）
- Redux store（editChatName action 保持不变）
- 其他组件
