# Proposal: 更新 ModelProviderKeyEnum 定义以符合 models.dev API

## Why

当前 `ModelProviderKeyEnum` 的定义与 `ALLOWED_MODEL_PROVIDERS` 白名单以及 models.dev API 的提供商标识不一致，导致类型系统无法正确约束供应商数据。这种不一致可能引起运行时错误和类型安全问题。现在需要修正这个问题，因为远程模型数据获取功能已经实现，类型定义必须与实际数据源保持一致。

## What Changes

- **修改** `src/utils/enums.ts` 中的 `ModelProviderKeyEnum` 枚举定义，使其值与 `ALLOWED_MODEL_PROVIDERS` 完全一致
- **新增** 枚举成员 `MOONSHOTAI = 'moonshotai'`（替换原有的 `KIMI = 'kimi'`）
- **修改** 枚举成员 `ZHIPUAI = 'zhipuai'`（替换原有的 `BIG_MODEL = 'bigmodel'`）
- **新增** 枚举成员 `ZHIPUAI_CODING_PLAN = 'zhipuai-coding-plan'`
- **BREAKING** 删除 `KIMI` 和 `BIG_MODEL` 枚举成员（值不匹配）
- **影响** 所有使用 `ModelProviderKeyEnum` 的代码需要更新引用

## Capabilities

### New Capabilities
无（这是类型定义的修正，不引入新功能）

### Modified Capabilities
无（`remote-model-fetch` spec 没有规定 `ModelProviderKeyEnum` 的具体值，这只是实现细节的修正）

## Impact

**受影响的代码模块**：
- `src/utils/enums.ts` - 核心修改点
- `src/types/model.ts` - 导入并使用 `ModelProviderKeyEnum` 的类型定义
- 所有使用 `ModelProviderKeyEnum.KIMI` 的代码需要改为 `ModelProviderKeyEnum.MOONSHOTAI`
- 所有使用 `ModelProviderKeyEnum.BIG_MODEL` 的代码需要改为 `ModelProviderKeyEnum.ZHIPUAI`

**受影响的类型系统**：
- `SystemConfigModel.providerKey` 字段类型
- 所有依赖 `ModelProviderKeyEnum` 的类型推断和类型检查

**不影响运行时行为**：
- 这是一个纯类型层面的修正
- 不改变应用的运行时逻辑
- 不影响 Redux 状态管理、数据持久化或网络请求

**风险**：
- 如果代码库中存在使用旧枚举值的硬编码字符串，可能需要同步更新
- 需要运行类型检查（`pnpm tsc`）验证所有引用已正确更新
