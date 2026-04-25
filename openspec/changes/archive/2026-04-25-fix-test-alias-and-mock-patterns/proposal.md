## Why

测试系统中存在两个已确认的技术债务：

1. **`@/test-helpers` 路径别名从未工作**：`vite.config.ts` 中的 `"@"` 别名（前缀匹配）排在 `"@/test-helpers"` 之前，导致 `@/test-helpers` 被解析为不存在的 `./src/test-helpers`。自 2026-02-26 `model-provider-setting-tests` 变更记录此问题后，所有测试绕道使用 `@/__test__/helpers/...`。但该别名仍残留在配置和 20+ 个 OpenSpec 规范文档中，造成文档与现实不一致。

2. **highlight.js mock 未遵循 `globalThis` 工厂模式**：`helpers/mocks/highlight.ts` 导出静态对象 `highlightJsMockFactory`，而非工厂函数。2 个测试文件通过 `require()` 在 `vi.mock()` 工厂内导入，与项目其他 9 个已迁移到 `globalThis.__createXxxMock()` 模式的 mock 不一致。

## What Changes

- 删除 `vite.config.ts` 中不可用的 `@/test-helpers` 和 `@/test-helpers/*` 别名
- 删除 `tsconfig.json` 中对应的 `@/test-helpers` 和 `@/test-helpers/*` 路径映射
- 将 `helpers/mocks/highlight.ts` 的静态对象重构为 `createHighlightJsMock()` 工厂函数
- 在 `setup/base.ts` 中注册 `globalThis.__createHighlightJsMock`
- 在 `vitest.d.ts` 中添加对应类型声明
- 将 `ChatBubble.test.tsx` 和 `ThinkingSection.test.tsx` 中的 `require()` 替换为 `globalThis.__createHighlightJsMock()`

## Capabilities

### New Capabilities

（无新能力引入）

### Modified Capabilities

- `test-configuration`：移除不可用的 `@/test-helpers` 路径别名相关要求（第 93-103 行），统一为 `@/__test__/helpers` 路径
- `shared-mock-factories`：新增 highlight.js mock 工厂函数的 globalThis 注册要求

## Impact

- **配置文件**：`vite.config.ts`（删除 2 个别名）、`tsconfig.json`（删除 2 个路径映射）
- **测试基础层**：`setup/base.ts`（新增 1 个 globalThis 注册）、`vitest.d.ts`（新增 1 个类型声明）
- **Mock 模块**：`helpers/mocks/highlight.ts`（重构为工厂函数）
- **测试文件**：`ChatBubble.test.tsx`、`ThinkingSection.test.tsx`（替换 `require()` 为 `globalThis`）
- **OpenSpec 文档**：`specs/test-configuration/spec.md`、`specs/shared-mock-factories/spec.md`（同步更新要求）
