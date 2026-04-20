## MODIFIED Requirements

### Requirement: MSW handler 无注册冲突

同一 URL 的多个 HTTP handler MUST 通过条件分支区分，而非注册多个无条件匹配的 handler。handler MUST 按以下优先级匹配：
1. 流式场景（`body.stream === true`）
2. 默认成功场景

错误场景 MUST NOT 包含在默认 handler 集中，而由 `setupErrorHandlers` 按需覆盖。

#### Scenario: DeepSeek handler 条件分支

- **WHEN** 向 `https://api.deepseek.com/chat/completions` 发送 POST 请求
- **THEN** handler SHALL 根据 `body.stream` 值决定返回流式或 JSON 响应

#### Scenario: 流式场景可被触发

- **WHEN** 请求体包含 `stream: true`
- **THEN** handler SHALL 返回 SSE 流式响应，而非默认 JSON 响应

#### Scenario: 错误场景通过 setupErrorHandlers 覆盖

- **WHEN** 测试需要模拟 API 错误
- **THEN** 测试 SHALL 调用 `setupErrorHandlers(server)` 覆盖默认 handler，MUST NOT 在默认 handler 集中包含无条件错误响应
