# 增强聊天服务原始信息收集 - 实施任务清单

## 1. 准备阶段

- [x] 1.1 在 `src/types/chat.ts` 中新增 `StandardMessageRawResponse` 接口定义
- [x] 1.2 修改 `src/types/chat.ts` 中的 `StandardMessage.raw` 字段类型（从 `string | null` 改为 `StandardMessageRawResponse | null`）
- [x] 1.3 在 `src/types/chat.ts` 中新增 `isEnhancedRawResponse(raw)` 类型守卫函数
- [x] 1.4 在 `src/types/chat.ts` 中新增 `formatRawResponse(raw)` 格式化函数
- [x] 1.5 创建 `src/__tests__/mocks/rawResponse.ts` 文件，定义 Mock 原始响应数据
- [x] 1.6 在 `src/__tests__/mocks/rawResponse.ts` 中为不同供应商（DeepSeek、MoonshotAI、Zhipu）创建 Mock 数据

## 2. 核心实现（基础数据收集）

- [x] 2.1 在 `src/services/chatService.ts` 的 `streamChatCompletion()` 函数中添加流式事件统计变量（`textDeltaCount`、`reasoningDeltaCount`、`streamStartTime`）
- [x] 2.2 在 `streamChatCompletion()` 的流式处理循环中统计 `text-delta` 和 `reasoning-delta` 事件数量
- [x] 2.3 在 `streamChatCompletion()` 中收集 `result.response` 元数据（`id`、`modelId`、`timestamp`、`headers`）
- [x] 2.4 在 `streamChatCompletion()` 中收集 `result.request` 元数据（`body`）
- [x] 2.5 在 `streamChatCompletion()` 中收集 `result.usage` 元数据（`inputTokens`、`outputTokens`、`totalTokens`、`inputTokenDetails`、`outputTokenDetails`）
- [x] 2.6 在 `streamChatCompletion()` 中收集 `result.finishReason` 和 `result.rawFinishReason`
- [x] 2.7 在 `streamChatCompletion()` 中构建 `StandardMessageRawResponse` 对象（包含阶段 1 的基础字段）
- [x] 2.8 在 `streamChatCompletion()` 的最终消息中设置 `raw` 字段为构建的原始响应对象

## 3. 核心实现（增强数据收集）

- [x] 3.1 在 `streamChatCompletion()` 中收集 `result.providerMetadata` 元数据
- [x] 3.2 在 `streamChatCompletion()` 中收集 `result.warnings` 警告信息
- [x] 3.3 在 `streamChatCompletion()` 中计算流式处理耗时（`streamEndTime - streamStartTime`）
- [x] 3.4 在 `streamChatCompletion()` 中收集 `result.sources` RAG 来源信息
- [x] 3.5 在 `streamChatCompletion()` 中扩展 `StandardMessageRawResponse` 对象，添加阶段 2 的增强字段（`providerMetadata`、`warnings`、`streamStats`、`sources`）

## 4. 安全性实现

- [x] 4.1 在 `streamChatCompletion()` 中实现 `request.body` 敏感信息过滤逻辑（移除 `apiKey`、`authorization` 等字段）
- [x] 4.2 在 `streamChatCompletion()` 中实现 `response.headers` 敏感信息过滤逻辑（移除 `Authorization` 头等）
- [x] 4.3 在 `streamChatCompletion()` 中实现 `request.body` 大小限制逻辑（超过 10KB 时截断）
- [x] 4.4 添加敏感信息过滤的单元测试（验证 API Key、Authorization 头被正确移除）

## 5. 错误处理实现

- [x] 5.1 在 `streamChatCompletion()` 中添加元数据收集的错误捕获逻辑（`try-catch` 包裹每个元数据收集操作）
- [x] 5.2 在 `streamChatCompletion()` 中实现 `errors` 字段记录收集过程中的错误
- [x] 5.3 确保元数据收集失败时不中断消息流（继续 yield 消息内容）
- [x] 5.4 添加错误处理的单元测试（模拟网络错误，验证错误不中断消息流）

## 6. 测试实现（单元测试）

- [x] 6.1 在 `src/__tests__/services/chatService.test.ts` 中添加基础数据收集的测试用例（验证 `response`、`request`、`usage`、`finishReason` 正确收集）
- [x] 6.2 在 `src/__tests__/services/chatService.test.ts` 中添加流式事件统计的测试用例（验证 `textDeltaCount`、`reasoningDeltaCount`、`duration` 正确统计）
- [x] 6.3 在 `src/__tests__/services/chatService.test.ts` 中添加供应商差异的测试用例（测试 DeepSeek、MoonshotAI、Zhipu 三个供应商的原始数据收集）
- [x] 6.4 在 `src/__tests__/services/chatService.test.ts` 中添加 RAG Sources 的测试用例（验证 `sources` 数据正确收集）
- [x] 6.5 在 `src/__tests__/services/chatService.test.ts` 中添加向后兼容性的测试用例（验证旧消息的 `raw` 字段正常显示）
- [x] 6.6 在 `src/__tests__/services/chatService.test.ts` 中添加错误处理的测试用例（验证元数据收集失败时不中断消息流）
- [x] 6.7 在 `src/__tests__/types/chat.test.ts` 中添加类型守卫和格式化函数的测试用例

## 7. 测试实现（集成测试）

- [ ] 7.1 添加端到端聊天流程的集成测试（发送消息并验证最终消息包含完整的 `raw` 数据）
- [ ] 7.2 添加加密存储集成的集成测试（验证 `raw` 数据正确加密和解密）
- [ ] 7.3 添加向后兼容性的集成测试（验证旧消息和新消息在存储中共存）

## 8. 测试实现（性能测试）

- [ ] 8.1 添加加密性能测试（测试不同大小的 `raw` 数据的加密时间，对比修改前后的消息保存时间）
- [ ] 8.2 添加存储空间测试（测试 1000 条消息的存储空间占用，对比启用/禁用 `raw` 数据收集的空间差异）
- [ ] 8.3 添加读取性能测试（测试加载 100、500、1000 条历史消息的时间，对比启用/禁用 `raw` 数据收集的加载时间）

## 9. UI 层适配（辅助功能）

- [x] 9.1 导出 `isEnhancedRawResponse()` 和 `formatRawResponse()` 函数到 `@/types/chat`
- [x] 9.2 在需要显示 `raw` 数据的地方使用类型守卫判断格式（如消息详情页面）
- [x] 9.3 在需要显示 `raw` 数据的地方使用格式化函数转换为可读格式

## 10. 文档与发布

- [x] 10.1 更新 `AGENTS.md`，添加 `raw` 数据结构说明和新的类型定义文档
- [x] 10.2 运行 `pnpm lint` 和 `pnpm tsc`，确保代码通过 lint 和类型检查
- [x] 10.3 运行 `pnpm test:run`，确保所有测试通过
- [x] 10.4 进行代码审查，确认实现符合设计文档和规范

## 11. 可选优化（后续迭代）

- [ ] 11.1 实现选择性存储配置（添加配置项控制是否保存完整的 `request.body` 和 `response.headers`）
- [ ] 11.2 实现数据压缩功能（对 `raw` 数据进行 gzip 压缩）
- [ ] 11.3 在 UI 层添加"查看详细信息"功能（显示格式化后的 `raw` 数据）
- [ ] 11.4 在 UI 层添加"开发者模式"开关（默认不显示详细的技术信息）
