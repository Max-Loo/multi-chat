## 1. 类型收紧

- [x] 1.1 将 `src/services/initialization/types.ts` 中 `dependencies?: string[]` 改为 `dependencies?: StepName[]`
- [x] 1.2 将 `src/__test__/services/lib/initialization/fixtures.ts` 中 `TestInitStep` 的定义改为同时放宽 `name` 和 `dependencies`

## 2. 验证

- [x] 2.1 运行 `pnpm tsc` 确认无类型错误
- [x] 2.2 运行 `pnpm lint` 确认无 lint 错误
