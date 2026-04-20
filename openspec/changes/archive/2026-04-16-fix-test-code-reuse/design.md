## Context

当前 `src/__test__/` 中存在两类代码复用问题：

1. **react-i18next mock 重复**：44 个文件各自通过 `vi.mock('react-i18next', ...)` 定义几乎相同的 mock 块（每个约 25-40 行）。`helpers/mocks/i18n.ts` 已存在 `createI18nMockReturn` 工厂函数，但因 `vi.hoisted` 不支持 `@/` 路径别名而无法直接导入使用。
2. **`as unknown as` 散落**：22 处类型转换分布在 10 个文件中。`helpers/testing-utils.tsx` 中已有 `asTestType<T>()` 辅助函数，但大部分文件仍使用内联 `as unknown as` 模式。

约束条件：
- 所有变更仅在 `src/__test__/` 目录内，不涉及业务代码
- vitest 的 `vi.hoisted` 与 `vi.mock` 对模块作用域和路径别名有特定限制
- 迁移必须保证测试行为完全不变

## Goals / Non-Goals

**Goals:**
- 为 react-i18next mock 提供可直接导入的工厂方案，将 44 个文件的 mock 定义缩减到每个 ~5 行
- 将 22 处 `as unknown as` 统一迁移为 `asTestType<T>()` 调用
- 确保迁移后所有测试行为不变

**Non-Goals:**
- 不处理第二层的反模式问题（`as any`、测试内部实现细节等）
- 不处理第四层的覆盖盲区（无测试的模块）
- 不修改 vitest 配置或测试框架本身
- 不重构 `helpers/mocks/redux.ts` 中的 `any` 类型（属于第二层问题）

## Decisions

### D1: react-i18next mock 工厂方案 — 使用 `vi.hoisted` 内联 + 参考实现

**方案选择**：保留 `helpers/mocks/i18n.ts` 作为参考实现和文档，在每个测试文件中通过 `vi.hoisted` 内联定义工厂函数。

**原因**：
- `vi.hoisted` 不支持 `@/` 路径别名，直接导入工厂函数会导致模块解析失败
- `vi.hoisted` 在 `vi.mock` 之前提升执行，内联定义是 vitest 要求的写法
- 参考实现 `helpers/mocks/i18n.ts` 已包含完整 JSDoc 示例，可直接复制模板

**替代方案（已排除）**：
- 在 `vitest.config.ts` 中配置别名映射使 `vi.hoisted` 支持路径别名 → 涉及构建配置变更，风险过高
- 使用 `__mocks__` 目录实现自动 mock → 会影响所有测试文件，无法按需定制翻译资源

**实际做法**：
- 更新 `helpers/mocks/i18n.ts` 的 JSDoc 示例，确保模板更简洁（~5 行可用）
- 逐文件迁移，将 30+ 行的 mock 块替换为 ~5 行的模板调用
- 迁移后验证测试通过

### D2: `as unknown as` 迁移 — 扩大 `asTestType<T>()` 使用范围

**方案选择**：将所有 `as unknown as` 替换为 `asTestType<T>()`。

**原因**：
- `asTestType<T>()` 已存在于 `helpers/testing-utils.tsx`，语义统一
- 函数调用比类型断言链更易 grep 和审查
- 单点维护：未来如需调整转换逻辑，只需修改一处

**替代方案（已排除）**：
- 引入更细粒度的类型辅助（如 `asMockRouter`、`asMockStore`）→ 过度抽象，YAGNI

## Risks / Trade-offs

- **[Risk] i18n mock 模板仍需内联** → 缓解：通过 JSDoc 提供可复制的标准模板，且模板仅需 ~5 行，维护成本可接受
- **[Risk] 批量迁移可能引入拼写错误** → 缓解：逐文件迁移后立即运行相关测试验证
- **[Trade-off] 未从根本上解决 `vi.hoisted` 路径别名限制** → 接受：这是 vitest 的已知限制，等待上游修复比自行 workaround 更安全
