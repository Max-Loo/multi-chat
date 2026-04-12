## Context

`src/utils/tauriCompat/env.ts` 导出的 `isTestEnvironment()` 函数通过 4 项检测判断运行环境。该函数被 `getPBKDF2Iterations()` 调用，进而被密钥派生逻辑使用。运行时环境在进程生命周期内固定不变，无需重复检测。

## Goals / Non-Goals

**Goals:**
- 将 `isTestEnvironment()` 的返回值在模块加载时计算一次并缓存
- 保持公共 API 签名不变，所有调用方无需修改

**Non-Goals:**
- 不改变环境检测的具体方式（仍保留 4 项检测逻辑）
- 不引入新的模块或依赖

## Decisions

**模块级常量缓存**

在模块作用域计算一次并存储为常量，`isTestEnvironment()` 和 `getPBKDF2Iterations()` 均引用该常量。

```typescript
const _isTestEnv = isTestEnvironment();

export const getPBKDF2Iterations = (): number =>
  _isTestEnv ? 1000 : 100000;
```

`isTestEnvironment()` 函数保留导出（供外部使用），但内部不再被热路径调用。

**备选方案：惰性单例（lazy init）** — 首次调用时计算并缓存。不必要的复杂度，因为模块加载时即可确定结果。

## Risks / Trade-offs

- **测试 mock 兼容性** → `vi.mock()` 在模块加载前注入 mock 实现，缓存的是 mock 后的值。现有测试行为不变。无风险。
