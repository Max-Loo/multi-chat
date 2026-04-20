## Why

测试代码中存在两类显著的重复模式：44 个文件各自定义 `vi.mock('react-i18next')` 块（每个约 25-40 行），以及 22 处 `as unknown as` 类型转换分散在 10 个文件中。这些重复增加了维护成本——当 mock 行为需要调整时，需逐一修改数十个文件；同时也违反 DRY 原则，降低了测试代码的可读性和一致性。

## What Changes

- 在 `helpers/mocks/i18n.ts` 中提供标准化的 react-i18next mock 模板，通过 `vi.hoisted` 内联方式在测试文件中使用（因 vitest 的 `vi.hoisted` 不支持 `@/` 路径别名，无法直接导入工厂函数）
- 将使用选择器函数的测试文件中的 `vi.mock('react-i18next')` 内联定义统一迁移为标准化模板，每个文件从 ~30 行减少到 ~5 行
- 在 `helpers/testing-utils.tsx` 中已有 `asTestType<T>()` 的基础上，推动 22 处 `as unknown as` 迁移为统一辅助函数调用
- 清理迁移后的冗余代码

## Capabilities

### New Capabilities
- `i18n-test-mock-factory`: 标准化的 react-i18next 测试 mock 模板（`vi.hoisted` 内联 + `vi.mock` 集成），覆盖字符串键与选择器函数两种 `t()` 调用模式

### Modified Capabilities
- `type-safe-test-helpers`: 扩展 `asTestType<T>()` 的使用范围，从当前 1 处扩展到覆盖全部 22 处 `as unknown as` 场景

## Impact

- **测试基础设施**：`helpers/mocks/i18n.ts`、`helpers/testing-utils.tsx` 将被修改
- **测试文件**：使用选择器函数的 react-i18next mock 测试文件需重写 mock 块；约 10 个使用 `as unknown as` 的文件需替换为 `asTestType<T>()`
- **无业务代码影响**：所有变更仅涉及 `src/__test__/` 目录
- **无 Breaking Change**：迁移后测试行为不变，仅减少重复代码
