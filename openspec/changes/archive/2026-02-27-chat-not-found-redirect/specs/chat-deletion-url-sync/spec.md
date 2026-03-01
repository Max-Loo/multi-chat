# 聊天删除时的 URL 同步清除能力 - 增量规格说明

**说明**: 本变更（`chat-not-found-redirect`）引入了新的重定向逻辑来处理用户通过 URL 访问不存在的聊天时的场景。这与现有的 `chat-deletion-url-sync` 规范是互补的，而非修改关系。

- `chat-deletion-url-sync` 处理的是：**删除操作时**的 URL 同步
- `chat-not-found-redirect` 处理的是：**页面加载时**对不存在聊天的重定向

两者的边界清晰，不发生重叠：
- 当用户删除聊天时，chat-deletion-url-sync 确保清除 URL 参数
- 当用户访问带有无效 chatId 的 URL 时，chat-not-found-redirect 确保重定向到默认页面

**结论**: 本变更不修改 `chat-deletion-url-sync` 规范的任何需求。

## MODIFIED Requirements

（无修改 - 本变更不涉及现有需求的变更）

### Requirement: 删除聊天时同步清除 URL 查询参数
**无修改**: 现有需求保持不变。

### Requirement: 提供导航辅助函数用于清除查询参数
**无修改**: 现有需求保持不变。

### Requirement: 删除操作失败时不修改 URL
**无修改**: 现有需求保持不变。
