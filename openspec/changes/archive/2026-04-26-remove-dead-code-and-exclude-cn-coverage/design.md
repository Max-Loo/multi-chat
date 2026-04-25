## Context

`src/utils/utils.ts` 当前行覆盖率 54.5%、分支覆盖率 0%，是 `src/utils/` 模块中覆盖率最低的文件。根因是两个导出函数：

1. `getStandardRole`（行 33-48）：将字符串映射为 `ChatRoleEnum` 枚举值。全仓库搜索确认零调用者。
2. `cn`（行 55-57）：`clsx` + `twMerge` 的一行组合，被 30 个文件导入。这是 shadcn/ui 的标准模式，不含业务逻辑。

此外 `src/utils/highlightLanguageIndex.ts`（39% 行覆盖率）是一个 46 个 case 的纯动态 import 映射文件，在测试中被完整 mock，测试每个分支意味着加载 46 个 highlight.js 语言包，成本远大于收益。

## Goals / Non-Goals

**Goals:**
- 删除已确认的死代码 `getStandardRole`
- 将不含业务逻辑的薄包装（`cn`）和纯映射文件（`highlightLanguageIndex`）排除出覆盖率计算
- 使 `src/utils/` 模块覆盖率反映真实的测试质量

**Non-Goals:**
- 不为 `cn` 或 `highlightLanguageIndex` 编写单元测试（测试第三方库无意义）
- 不修改 `ChatRoleEnum` 枚举定义或其他调用方的逻辑
- 不调整各模块的覆盖率阈值

## Decisions

### Decision 1: 删除而非补测 getStandardRole

**选择**：直接删除 `getStandardRole` 函数及其 `ChatRoleEnum` 和 `isNil` 导入。

**替代方案**：补写单元测试覆盖其分支。

**理由**：函数零调用者，是死代码。补测只增加维护负担，不提升系统质量。删除后分支覆盖率自然从 0% 升至 100%（剩余函数均无分支）。

### Decision 2: 排除 cn 而非测试

**选择**：将 `cn` 加入 `vite.config.ts` 的 `coverage.exclude`。

**替代方案**：为 `cn` 编写测试（验证 clsx 的合并、tailwind-merge 的冲突解决）。

**理由**：`cn` 是 `twMerge(clsx(inputs))` 的一行包装，等价于测试两个成熟第三方库。30 个调用方的组件测试已经间接验证了 `cn` 的正确性。

### Decision 3: 排除 highlightLanguageIndex

**选择**：将 `highlightLanguageIndex.ts` 加入 `coverage.exclude`。

**替代方案**：为每个 case 编写动态 import 测试。

**理由**：46 个 switch case 均为 `return import('highlight.js/lib/languages/...')` 的纯映射。该文件在 `highlightLanguageManager.test.ts` 中被完整 mock，真正的语言加载逻辑由 `highlightLanguageManager.ts` 的测试覆盖。测试 46 个 import 分支只增加运行时间。

## Risks / Trade-offs

- **误删风险** → 已通过全仓库 grep 确认 `getStandardRole` 零调用者。无动态导入或字符串拼接引用模式。
- **排除后覆盖率虚高** → 排除项均为不含业务逻辑的代码，排除后数字更准确地反映真实测试质量。
- **cn 未来可能增加逻辑** → 届时再从 exclude 移除并补写测试。当前 cn 是纯透传包装。
