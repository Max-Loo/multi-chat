## Why

i18n.ts 的变异测试中存在 1 个 BooleanLiteral 存活变异体（L219 `migrated: false` → `migrated: true`），测试未能检测到该默认值被篡改。当前 i18n.ts 变异得分为 92.25%，杀死此变异体可进一步提升得分并消除迁移标记初始化的测试盲区。

## What Changes

- 确认 L219 `migrated: false` BooleanLiteral 变异体为等价变异体（默认值无 `from` 属性，`migrated && from` 短路行为一致，无法通过外部行为区分）
- 在 `src/services/i18n.ts` L219 添加 `// Stryker disable BooleanLiteral` 排除该等价变异体
- 修正 `i18n.test.ts` 中声称能杀死此变异体的误导性注释

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `i18n-mutation-coverage`: 新增对 `initI18n` 中 `migrated` 默认值初始化的变异测试要求

## Impact

- 生产代码：`src/services/i18n.ts`（添加 Stryker disable 注释，无逻辑变更）
- 测试文件：`src/__test__/services/lib/i18n.test.ts`（修正注释）
- 无 API、依赖变更
