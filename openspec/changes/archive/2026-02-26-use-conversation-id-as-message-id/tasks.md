## 1. 代码修改

- [x] 1.1 修改 `src/services/chatService.ts` 第 141 行，使用解构赋值默认值语法：将 `const { model, historyList, message } = params;` 改为 `const { model, historyList, message, conversationId = generateId() } = params;`，并移除后续代码中的 `messageId` 中间变量，直接使用 `conversationId`
- [x] 1.2 更新 `streamChatCompletion()` 函数的文档注释（第 99-130 行），在 `@description` 部分添加消息 ID 生成规则说明

## 2. 验证测试

- [x] 2.1 运行 `pnpm tsc` 进行类型检查，确保无类型错误
- [x] 2.2 运行 `pnpm lint` 进行代码检查，确保符合代码规范
- [x] 2.3 手动测试流式聊天功能，验证消息 ID 的生成逻辑：
  - 测试场景 1：不传递 `conversationId`，验证自动生成的 ID
  - 测试场景 2：传递 `conversationId`，验证使用传入的 ID
