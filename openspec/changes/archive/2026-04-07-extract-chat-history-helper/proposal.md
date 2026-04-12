## Why

`chatSlices.ts` 中「定位 chat → 定位 model → 追加 history」的导航逻辑在 3 个不同位置重复（`pushChatHistory`、`sendMessage.fulfilled`、`startSendChatMessage.rejected`）。这是典型的时间分解问题——按执行时机而非功能职责组织代码。重复导致数据结构变更时需同步修改多处，遗漏任何一处都会造成消息静默丢失。

## What Changes

- 提取 `appendHistoryToModel(state, chatId, modelId, message)` 辅助函数
- 替换 `pushChatHistory` reducer 中的内联导航逻辑
- 替换 `sendMessage.fulfilled` 处理器中的内联导航逻辑
- 替换 `startSendChatMessage.rejected` 处理器中的内联导航逻辑
- 无行为变更，纯重构

## Capabilities

### New Capabilities
- `chat-history-helper`: 聊天历史消息追加的统一辅助函数，封装 chatList 导航和消息写入逻辑

### Modified Capabilities

（无——行为不变，仅内部实现调整）

## Impact

- **影响文件**: `src/store/slices/chatSlices.ts`（主要修改）
- **影响范围**: 仅 chat slice 内部实现，不涉及外部 API 或组件接口
- **测试**: 现有 `chat-slices-testing` 测试应全部通过，无需新增测试用例
