## 1. 类型定义更新

- [x] 1.1 修改 `src/types/chat.ts` 中的 `StandardMessage` 接口
  - 将 `tokensUsage?` 重命名为 `usage?`
  - 将 `prompt` 字段重命名为 `inputTokens`
  - 将 `completion` 字段重命名为 `outputTokens`
  - 移除 `cached?` 可选字段

- [x] 1.2 运行 `pnpm tsc` 检查类型错误，识别所有需要更新的引用

## 2. 核心服务更新

- [x] 2.1 更新 `src/services/chatService.ts` 中的响应转换逻辑
  - 修改 `streamChatCompletion` 函数
  - 直接映射 `response.usage.inputTokens` 到 `message.usage.inputTokens`
  - 直接映射 `response.usage.outputTokens` 到 `message.usage.outputTokens`
  - 移除旧的字段名转换逻辑（如果有）

## 3. 组件和依赖更新

- [x] 3.1 全局搜索并更新所有 `tokensUsage` 引用
  - 使用编辑器或 `rg` 搜索 `tokensUsage`
  - 将所有访问 `message.tokensUsage?.prompt` 的代码改为 `message.usage?.inputTokens`
  - 将所有访问 `message.tokensUsage?.completion` 的代码改为 `message.usage?.outputTokens`

- [x] 3.2 更新聊天界面组件
  - 检查并更新所有显示 token 统计的 UI 组件
  - 确保使用新的字段名访问数据

- [x] 3.3 更新所有测试代码中的 Mock 数据
  - 搜索测试文件中的 `tokensUsage` 引用
  - 更新 Mock 数据使用新的 `usage` 结构
  - 更新测试断言使用新的字段名

- [x] 3.4 运行测试套件确保无破坏
  - 执行 `pnpm test`
  - 执行 `pnpm tsc`
  - 修复所有测试失败和类型错误

## 4. 验证和清理

 - [x] 4.1 手动测试聊天功能
   - 发送测试消息，验证 token 统计正确显示
   - 检查流式响应中的 usage 数据是否正确提取
   - 验证新消息保存使用 `usage` 格式

 - [x] 4.2 最终代码检查
   - 全局搜索确认无残留 `tokensUsage` 引用
   - 确认代码通过 ESLint 检查（`pnpm lint`）
   - 确认无 TypeScript 错误（`pnpm tsc`）
   - 确认所有测试通过（`pnpm test`）

 - [x] 4.3 更新项目文档
   - 更新 README.md 中涉及 `StandardMessage` 类型的说明（如有）
   - 记录数据迁移逻辑和向后兼容性说明（通过代码注释）
