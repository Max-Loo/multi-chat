## MODIFIED Requirements

### Requirement: 标题生成服务接口
系统必须提供统一的标题生成服务接口，使用 `generateText` API。

#### Scenario: 调用标题生成服务
- **WHEN** 需要生成标题
- **THEN** 系统调用 `generateChatTitleService(messages, model)`
- **AND** 传入最后 2 条消息（用户 + 助手）
- **AND** 传入使用的模型配置

#### Scenario: 使用非流式 API
- **WHEN** 标题生成服务内部实现
- **THEN** 使用 `generateText` 而非 `streamText`
- **AND** 等待完整响应后返回

#### Scenario: 测试隔离
- **WHEN** 测试需要 mock `generateText` 或 `getProvider`
- **THEN** 使用 `vi.mock` 拦截模块，通过 `vi.mocked()` 覆盖行为
- **AND** 生产代码签名保持干净，不受测试关注点影响
