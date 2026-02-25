# Chat Message Sending Capability - Delta Specification

## 变更说明

本次变更中，`chat-message-sending` 能力的行为需求**未发生变化**。

所有变更集中在**实现层**：
- 从 OpenAI SDK（`openai` 包）迁移到 Vercel AI SDK（`ai` 包及供应商特定的 provider 包）
- 重构 `ChatService.streamChatCompletion()` 的内部实现
- 移除 `urlNormalizer.ts` 模块（URL 标准化由 ai-sdk provider 自动处理）
- 移除对 `OPEN_AI` 供应商的支持

从用户和 Redux Thunk 的角度看：
- `ChatService.streamChatCompletion()` 的函数签名保持不变
- 返回的 `StandardMessage` 格式保持不变
- 流式响应的行为模式保持不变
- 信号中断（`AbortSignal`）的行为保持不变

技术实现细节请参考 `design.md`。

## MODIFIED Requirements

无。

所有现有行为需求继续有效，无任何修改。

## REMOVED Requirements

### Requirement: 支持 OpenAI 供应商

**Reason**: 项目不再支持 OpenAI 供应商，专注于使用 ai-sdk 的三个供应商（DeepSeek、Kimi、Zhipu）。

**Migration**:
- 如果用户当前使用 OpenAI 供应商的 API Key，需要切换到支持的供应商之一（DeepSeek、Kimi 或 Zhipu）
- 更新 `ModelProviderKeyEnum` 枚举，移除 `OPEN_AI = 'openai'` 值
- 更新 `src/utils/constants.ts` 中的 `ALLOWED_MODEL_PROVIDERS` 白名单，移除 `'openai'`
- 从远程模型数据获取服务中过滤掉 OpenAI 相关的模型定义
