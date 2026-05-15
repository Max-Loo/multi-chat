## Why

providerLoader 变异得分 72.41%，是所有已配置模块中最低的（低于 80% 阈值），存在 6 个存活变异和 2 个未覆盖变异。crypto.ts 有 3 个存活变异，其中 2 个涉及密钥安全属性（`extractable`），1 个涉及错误链断言缺失（`cause` 属性）。这些存活变异暴露了测试对安全约束和错误对象结构验证的盲区。

## What Changes

- 为 providerLoader 补充测试用例，覆盖未测试的分支路径和缺少精确断言的逻辑，将变异得分从 72.41% 提升至 80% 以上
- 为 crypto.ts 补充 `error.cause` 属性断言，确保错误链完整性被验证
- 评估 crypto.ts 的 `extractable` 参数变异（BooleanLiteral），如可行则补充安全属性断言

## Capabilities

### New Capabilities

- `providerloader-mutation-coverage`: providerLoader 变异测试覆盖率提升规格，定义需要覆盖的存活变异和未覆盖路径
- `crypto-mutation-coverage`: crypto.ts 变异测试覆盖率提升规格，定义错误链断言和安全属性验证要求

### Modified Capabilities

（无）

## Impact

- 测试文件：`src/__test__/` 下 providerLoader 和 crypto 相关测试文件
- 配置文件：`stryker.config.json` 无变更
- 源码：无变更，仅补充测试用例
