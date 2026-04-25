## 1. 删除 @/test-helpers 死别名

- [x] 1.1 删除 `vite.config.ts` 中 `@/test-helpers` 和 `@/test-helpers/*` 两个 resolve.alias 条目
- [x] 1.2 删除 `tsconfig.json` 中 `@/test-helpers` 和 `@/test-helpers/*` 两个 paths 映射
- [x] 1.3 运行 `pnpm test:run` 验证别名删除不影响任何测试

## 2. highlight.js mock 迁移到 globalThis 工厂模式

- [x] 2.1 重构 `helpers/mocks/highlight.ts`：将 `highlightJsMockFactory` 静态对象包装为 `createHighlightJsMock()` 工厂函数
- [x] 2.2 在 `setup/base.ts` 中注册 `globalThis.__createHighlightJsMock`
- [x] 2.3 在 `vitest.d.ts` 中添加 `__createHighlightJsMock` 类型声明
- [x] 2.4 将 `ThinkingSection.test.tsx` 中的 `require()` 替换为 `globalThis.__createHighlightJsMock()`
- [x] 2.5 将 `ChatBubble.test.tsx` 中的 `require()` 替换为 `globalThis.__createHighlightJsMock()`
- [x] 2.6 运行 `pnpm test:run` 验证两个测试文件通过

## 3. 同步 OpenSpec 规格

- [x] 3.1 更新 `openspec/specs/test-configuration/spec.md`：移除 `@/test-helpers` 相关要求，统一为 `@/__test__/helpers` 路径
- [x] 3.2 更新 `openspec/specs/shared-mock-factories/spec.md`：新增 highlight.js mock 工厂要求
