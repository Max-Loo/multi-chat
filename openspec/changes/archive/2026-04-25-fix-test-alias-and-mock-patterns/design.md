## Context

测试基础设施在多次迭代中积累了两个已知技术债务，均已被归档变更记录但未修复：

1. **死别名**：`vite.config.ts` 定义了 `@/test-helpers` 路径别名，但由于 Vite 别名按插入顺序进行前缀匹配，`"@"` 别名（映射到 `./src`）先于 `"@/test-helpers"` 匹配，将 `@/test-helpers` 解析为不存在的 `./src/test-helpers`。自 2026-02-26 起所有测试使用 `@/__test__/helpers/...` 绕行。

2. **mock 模式不一致**：`highlight.js` mock（`helpers/mocks/highlight.ts`）导出静态对象，2 个测试文件用 `require()` 导入；其余 9 个 mock 全部使用 `globalThis.__createXxxMock()` 工厂模式。

当前状态：150 个单元测试（1788 测试用例）和 9 个集成测试（95 测试用例）全部通过。

## Goals / Non-Goals

**Goals:**

- 删除不可用的 `@/test-helpers` 别名，消除配置与文档中的不一致
- 将 highlight.js mock 迁移到 `globalThis` 工厂模式，与其他 9 个 mock 保持一致

**Non-Goals:**

- 不引入新的路径别名或测试框架配置
- 不修改 `highlightLanguageManager.test.ts` 的 `highlight.js/lib/core` mock（不同模块路径，独立 mock 策略）
- 不迁移 OpenSpec 归档文档中对 `@/test-helpers` 的历史引用（归档记录保持原样）
- 不改变集成测试的 setup 结构

## Decisions

### Decision 1：删除别名而非修复排序

**选择**：彻底删除 `@/test-helpers` 别名，不尝试通过调整别名排序来修复。

**理由**：
- 修复排序（将 `@/test-helpers` 放在 `@` 之前）虽然技术上可行，但引入了一个脆弱的隐式依赖——任何未来的配置变更都可能再次破坏排序
- 所有 150+ 个测试文件已稳定使用 `@/__test__/helpers/...` 路径，迁移回来没有实际收益
- `@/__test__/helpers/...` 通过 `@` → `./src` 映射直接解析，路径语义更清晰（明确指向 `__test__` 目录）

**备选方案**：
- 使用数组形式 `resolve.alias`（支持优先级控制）→ 过度工程化，当前不需要第二个别名
- 将 `@/test-helpers` 改为非 `@/` 前缀（如 `@test-helpers`）→ 与项目 `@/` 命名约定不一致

### Decision 2：highlight.js mock 工厂函数设计

**选择**：将 `highlightJsMockFactory` 静态对象包装为 `createHighlightJsMock()` 工厂函数，注册到 `globalThis.__createHighlightJsMock`。

**理由**：
- 与 `createMarkdownItMock()`、`createDompurifyMock()` 等已有工厂保持完全一致的模式
- 工厂函数允许未来测试自定义 highlight 行为（如返回特定的语法高亮结果）
- `globalThis` 模式解决了 `vi.mock()` 工厂内的 hoisting 限制

**工厂函数签名**：
```typescript
// helpers/mocks/highlight.ts
export function createHighlightJsMock() {
  return {
    default: {
      highlight: (str: string, _options: { language: string }) => ({ value: str }),
      highlightAuto: (str: string) => ({ value: str }),
      getLanguage: (lang: string) => lang !== undefined,
    },
  };
}
```

## Risks / Trade-offs

**[低风险] 删除别名后 OpenSpec 文档仍引用 `@/test-helpers`**
→ 归档的变更文档保持原样（历史记录）。仅更新活跃的 `specs/test-configuration/spec.md` 和 `specs/shared-mock-factories/spec.md`。

**[无风险] highlight.js mock 迁移**
→ 仅改变 mock 的注册/导入方式，mock 返回值结构完全不变。`ChatBubble.test.tsx` 和 `ThinkingSection.test.tsx` 的测试行为不变。
