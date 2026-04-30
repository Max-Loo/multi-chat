## 1. 配置 Stryker

- [x] 1.1 将 `src/services/chat/metadataCollector.ts` 加入 `stryker.config.json` 的 `mutate` 列表
- [ ] 1.2 运行 `pnpm test:mutation` 获取基线得分（⚠️ Stryker 与 Node.js v24/esbuild 存在兼容性问题，所有文件均无法运行变异测试，属于预存基础设施问题）

## 2. 补充 collectRequestMetadata 三路分支测试

- [x] 2.1 补充 body 为 undefined 时返回 '{}' 的测试
- [x] 2.2 补充 body 为 string 时直接返回的测试
- [x] 2.3 补充 body 为 object 时序列化的测试

## 3. 补充敏感字段删除测试

- [x] 3.1 补充四个敏感字段（apiKey/api_key/authorization/Authorization）全部删除的测试
- [x] 3.2 补充非敏感字段保留的测试
- [x] 3.3 精确化已有脱敏测试：逐字段验证 body 中每个 key 的存在/不存在

## 4. 补充请求体截断边界测试

- [x] 4.1 补充超过 10240 字符截断的测试：验证 body 以 '... (truncated)' 结尾
- [x] 4.2 补充恰好 10240 字符不截断的测试

## 5. 补充 collectResponseMetadata 敏感 header 过滤测试

- [x] 5.1 补充四个敏感 header（authorization/Authorization/x-api-key/X-API-Key）被逐一移除的测试，每个大小写变体独立验证
- [x] 5.2 补充非敏感 header 保留的测试
- [x] 5.3 精确化无 headers 测试：验证返回的 headers 为 undefined
- [x] 5.4 补充 timestamp 为非 Date 值（如 string）时使用 `new Date().toISOString()` 的测试

## 6. 补充 collectSources 条件测试

- [x] 6.1 补充仅保留 url 类型来源的测试
- [x] 6.2 补充过滤后空数组返回 undefined 的测试
- [x] 6.3 补充非空数组保留的测试

## 7. 补充 collectWarnings 条件分支测试

- [x] 7.1 补充 warning 有 code 和 message 的测试
- [x] 7.2 补充 warning 无 code 但有 type 的测试
- [x] 7.3 补充 warning 无 message 需拼接的测试
- [x] 7.4 补充 warnings 为空时返回空数组的测试

## 8. 补充 collectUsageMetadata 默认值测试

- [x] 8.1 补充 usage 为 undefined 时默认值为 0 的测试
- [x] 8.2 补充 usage 部分字段缺失时使用默认值的测试

## 9. 补充 collectFinishReasonMetadata 默认值测试

- [x] 9.1 补充 finishReason 为 null 时转换为 'other' 的测试
- [x] 9.2 补充 rawFinishReason 为 null 时转换为 undefined 的测试

## 10. 补充错误包装测试

- [x] 10.1 补充 collectProviderMetadata 失败包装为 MetadataCollectionError 的测试
- [x] 10.2 补充 collectWarnings 失败包装为 MetadataCollectionError 的测试
- [x] 10.3 补充 collectSources 失败包装为 MetadataCollectionError 的测试
- [x] 10.4 补充 collectFinishReasonMetadata 失败包装为 MetadataCollectionError 的测试

## 11. 运行变异测试验证

- [ ] 11.1 运行 `pnpm test:mutation`（⚠️ Stryker 基础设施问题阻塞，单元测试 46/46 全部通过）
- [ ] 11.2 验证 metadataCollector.ts 变异得分 ≥ 80%（阻塞：Stryker 与 Node.js v24 不兼容）
- [ ] 11.3 如未达标，根据报告分析剩余存活变异并补充测试（阻塞：依赖 11.2）
