## ADDED Requirements

### Requirement: collectRequestMetadata 三路分支覆盖
测试 SHALL 验证 `body` 参数的三种类型路径。

#### Scenario: body 为 undefined 时返回默认空对象字符串
- **WHEN** `requestData.body` 为 `undefined`
- **THEN** 返回的 `body` 字段为 `'{}'`

#### Scenario: body 为 string 时直接返回
- **WHEN** `requestData.body` 为 `'raw string'`
- **THEN** 返回的 `body` 字段为 `'raw string'`，不做 JSON 解析

#### Scenario: body 为 object 时序列化并脱敏
- **WHEN** `requestData.body` 为 `{ apiKey: 'secret', model: 'gpt' }`
- **THEN** 返回的 `body` 字段为 JSON 字符串，`apiKey` 被删除，`model` 保留

### Requirement: 敏感字段删除覆盖
测试 SHALL 验证 `collectRequestMetadata` 中四个敏感字段的完整删除。

#### Scenario: 四个敏感字段全部被删除
- **WHEN** body 包含 `apiKey`、`api_key`、`authorization`、`Authorization` 四个字段
- **THEN** 返回的 body 中四个字段都不存在

#### Scenario: 非敏感字段保留
- **WHEN** body 包含 `model`、`messages` 等非敏感字段
- **THEN** 这些字段在返回的 body 中保留

### Requirement: 请求体截断覆盖
测试 SHALL 验证超过 10KB 的请求体被截断。

#### Scenario: 超过 10240 字符时截断
- **WHEN** 序列化后的 body 长度 > 10240
- **THEN** 返回的 body 以 `... (truncated)` 结尾，且长度 ≤ 10240 + 后缀长度

#### Scenario: 恰好 10240 字符时不截断
- **WHEN** 序列化后的 body 长度恰好等于 10240
- **THEN** 返回的 body 完整保留

### Requirement: collectResponseMetadata 敏感 header 过滤覆盖
测试 SHALL 验证四个敏感 header key 被过滤。

#### Scenario: 四个敏感 header 被移除
- **WHEN** response headers 包含 `authorization`、`Authorization`、`x-api-key`、`X-API-Key`
- **THEN** 返回的 headers 中这四个 key 不存在

#### Scenario: 非敏感 header 保留
- **WHEN** response headers 包含 `content-type`、`x-request-id` 等
- **THEN** 这些 key 在返回的 headers 中保留

#### Scenario: 无 headers 时返回 undefined
- **WHEN** `responseData.headers` 为 `undefined`
- **THEN** 返回的 `headers` 字段为 `undefined`

### Requirement: collectSources 条件覆盖
测试 SHALL 验证来源过滤和空数组转换逻辑。

#### Scenario: 仅保留 url 类型来源
- **WHEN** sources 包含 `sourceType: 'url'` 和 `sourceType: 'file'` 两种类型
- **THEN** 仅保留 `sourceType: 'url'` 的来源

#### Scenario: 过滤后为空数组则返回 undefined
- **WHEN** 所有 sources 的 `sourceType` 都不是 'url'
- **THEN** 返回的 `sources` 为 `undefined`

#### Scenario: 非空数组保留
- **WHEN** 至少有一个 `sourceType: 'url'` 的 source
- **THEN** 返回过滤后的数组

### Requirement: collectWarnings 条件分支覆盖
测试 SHALL 验证 warning 对象不同字段组合的提取逻辑。

#### Scenario: warning 有 code 和 message
- **WHEN** warning 对象包含 `code: 'rate_limit'` 和 `message: 'Too many requests'`
- **THEN** 提取的 `code` 为 `'rate_limit'`，`message` 为 `'Too many requests'`

#### Scenario: warning 无 code 但有 type
- **WHEN** warning 对象无 `code` 属性但有 `type: 'safety'`
- **THEN** 提取的 `code` 为 `'safety'`

#### Scenario: warning 无 message 需拼接
- **WHEN** warning 对象无 `message` 属性但有 `type: 'safety'` 和 `details: 'flagged'`
- **THEN** 提取的 `message` 为拼接后的字符串

#### Scenario: warnings 为空时返回空数组
- **WHEN** `streamResult.warnings` 为 `undefined`
- **THEN** 返回空数组

### Requirement: collectUsageMetadata 默认值覆盖
测试 SHALL 验证所有 `??` 运算符的默认值行为。

#### Scenario: usage 为 undefined 时使用默认值
- **WHEN** `streamResult.usage` 为 `undefined`
- **THEN** `inputTokens` 为 `0`、`outputTokens` 为 `0`、`totalTokens` 为 `0`

#### Scenario: usage 部分字段缺失时使用默认值
- **WHEN** `streamResult.usage` 有 `inputTokens` 但无 `outputTokens`
- **THEN** `inputTokens` 使用实际值，`outputTokens` 为 `0`

### Requirement: collectFinishReasonMetadata 默认值覆盖
测试 SHALL 验证 finishReason 为 null 或 undefined 时的默认行为。

#### Scenario: finishReason 为 null 时转换为 'other'
- **WHEN** `streamResult.finalFinishReason` 为 `null`
- **THEN** 返回的 `finishReason` 为 `'other'`

#### Scenario: rawFinishReason 为 null 时转换为 undefined
- **WHEN** `streamResult.rawFinishReason` 为 `null`
- **THEN** 返回的 `rawFinishReason` 为 `undefined`

### Requirement: 错误包装覆盖
测试 SHALL 验证所有异步收集器的 `MetadataCollectionError` 包装。

#### Scenario: collectProviderMetadata 失败包装
- **WHEN** 获取 provider metadata 时抛出错误
- **THEN** 包装为 `MetadataCollectionError('providerMetadata', originalError)`

#### Scenario: collectWarnings 失败包装
- **WHEN** 处理 warnings 时抛出错误
- **THEN** 包装为 `MetadataCollectionError('warnings', originalError)`

#### Scenario: collectSources 失败包装
- **WHEN** 处理 sources 时抛出错误
- **THEN** 包装为 `MetadataCollectionError('sources', originalError)`
