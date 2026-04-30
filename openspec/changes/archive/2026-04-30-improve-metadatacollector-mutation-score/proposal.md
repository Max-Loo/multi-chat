## Why

`services/chat/metadataCollector.ts`（267 行 / 44 个条件表达式中约 16 个关键分支 / 5 条错误处理路径）是全项目条件密度最高的模块，负责从流式响应中提取 usage、token、来源、警告等元数据。`collectRequestMetadata` 包含三路分支（undefined / string / object）和 4 个敏感字段删除逻辑，`collectSources` 包含 URL 过滤和空数组转 undefined 的语义转换，`collectResponseMetadata` 包含敏感 header 过滤。这些条件分支的回归可能导致元数据丢失或敏感信息泄露。

## What Changes

- 将 `src/services/chat/metadataCollector.ts` 加入 `stryker.config.json` 的 `mutate` 列表
- 补充 `collectRequestMetadata` 所有分支的测试：body 为 undefined 时跳过、body 为 string 时直接返回、body 为 object 时 JSON.parse + 敏感字段删除、请求体大小截断边界
- 补充 `collectResponseMetadata` 敏感 header 过滤的测试：确保 authorization/Authorization/x-api-key/X-API-Key 被逐一移除（含大小写变体），其他 header 保留
- 补充 `collectSources` 的测试：URL 类型过滤、空数组转 undefined、非空数组保留
- 补充 `collectWarnings` 的测试：code/message 字段存在性判断、空数组默认值
- 补充 `collectFinishReasonMetadata` 的测试：null/undefined 默认值逻辑
- 补充各 catch 路径的测试：确保 `MetadataCollectionError` 的 category 和 cause 正确传播（含 `collectFinishReasonMetadata` 的错误路径）
- 补充 `collectResponseMetadata` 非 Date 时间戳的测试：验证 `instanceof Date` 为 false 时使用 `new Date().toISOString()`

## Capabilities

### New Capabilities

- `metadatacollector-mutation-coverage`: metadataCollector.ts 变异测试覆盖率提升，包含数据脱敏、敏感过滤、空值保护、错误包装的全面测试

### Modified Capabilities

（无）

## Impact

- **测试文件**: `src/__test__/services/chat/metadataCollector.test.ts` — 新增约 20-25 个测试用例
- **配置文件**: `stryker.config.json` — `mutate` 列表新增 1 个文件
- **构建时间**: 变异测试运行时间预计增加 1-2 分钟（预估 100-150 变异体）
- **CI/CD**: 无影响，变异测试不在 CI 流水线中运行
