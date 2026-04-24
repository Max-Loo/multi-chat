## Context

项目测试系统包含 157 个测试文件，`setup.ts` 作为全局测试基础设施提供 mock、断言扩展和清理机制。经深度审查（2026-04-23）和三次验证（2026-04-24），识别出 14 个 P0/P1 级问题全部未修复。这些问题分为四类：重复 mock 定义、死代码残留、过时测试模式、环境安全缺陷。

当前 `setup.ts` 已具备 `globalThis` 注册模式（`__createI18nMockReturn`、`__createResponsiveMock` 等），`helpers/mocks/` 目录已有成熟的 mock 工厂（`i18n.ts`、`responsive.ts`、`storage.ts`），`helpers/render/redux.tsx` 已提供 `renderWithProviders`。本次设计基于这些已有模式进行扩展。

## Goals / Non-Goals

**Goals:**

- 消除 setup.ts 和测试文件中的 mock 重复定义，统一为共享工厂
- 移除所有无实际作用的测试代码（冗余 cleanup、循环论证、注释残留、调试输出）
- 将过时的测试模式迁移为现代 Vitest 实践（fakeTimers、renderWithProviders、语义化断言）
- 修复测试环境隔离缺陷（window.location 未恢复）

**Non-Goals:**

- 不修改任何源代码（仅限 `src/__test__/` 目录）
- 不调整覆盖率阈值（P2 范围）
- 不补充缺失的测试文件（P2 范围）
- 不拆分超 400 行的测试文件（P2 范围）
- 不迁移 CSS 类名断言为语义化选择器（P2 范围）
- 不引入新的测试框架或工具

## Decisions

### D1: AI SDK provider mock 工厂函数方案

**决策**：在 `setup.ts` 内提取 `createMockAIProvider(providerName: string)` 工厂函数，三处 `vi.mock()` 各调用 1 行。

**替代方案**：
- A) 移到 `helpers/mocks/ai-sdk.ts` → 不行，因为 `vi.mock()` 必须在 `setup.ts` 顶层静态调用（Vitest hoisting 限制）
- B) 使用 `globalThis` 注册模式 → 不必要，工厂仅在 `setup.ts` 内部使用，不像 `useResponsive` 那样需要跨文件共享

**理由**：工厂函数仅在 `setup.ts` 内部使用，无需暴露到 `globalThis`。保持内聚性。

### D2: useAdaptiveScrollbar mock 存放位置

**决策**：创建 `helpers/mocks/scrollbar.ts`，通过 `setup.ts` 注册到 `globalThis.__createScrollbarMock`。

**理由**：与 `responsive.ts` 模式一致，多个测试文件需要在 `vi.mock()` 工厂中使用，受 Vitest hoisting 限制必须通过 `globalThis` 访问。

### D3: markdown-it/dompurify mock 统一策略

**决策**：创建 `helpers/mocks/markdown.ts` 和 `helpers/mocks/dompurify.ts`，以 ThinkingSection 的更完整版本为基础，仅迁移 ThinkingSection 使用共享 mock。ChatBubble 保留使用真实 markdown-it 和 DOMPurify 库。

**替代方案**：
- A) ChatBubble 也使用共享 mock → 不可行，ChatBubble 测试验证真实 HTML 渲染结果（`<strong>`、`<code>`、`<h1>` 标签生成），共享 mock 的正则替换无法覆盖 heading 和 inline code 语法

**理由**：ChatBubble 使用真实库是更优的测试实践——它验证组件与真实 markdown 渲染管道的集成。ThinkingSection 的 mock 包含 `onerror`/`onload` 属性处理等边界情况，功能更完整，适合作为共享 mock 的基础。

### D4: skeleton mock 全局化

**决策**：在 `setup.ts` 中添加 `vi.mock('@/components/ui/skeleton', ...)` 全局 mock。

**替代方案**：创建 `helpers/mocks/skeleton.ts` → 过度设计，4 个文件的 mock 逻辑极简（仅返回 `data-testid` div），全局 mock 更直接。

**理由**：skeleton 组件是纯展示组件，在测试中仅需作为占位符存在，全局 mock 无副作用风险。

### D5: window.location 修复方案

**决策**：首选 `vi.spyOn(window.location, 'reload')`。若 jsdom 中 `window.location` 属性不可配置导致 `vi.spyOn` 失败，使用 fallback：在 `beforeEach` 中保存原始 `window.location` 并用 `vi.fn()` 替换 `reload`，在 `afterEach` 中恢复。

**理由**：`vi.spyOn` 由 Vitest 自动管理 mock 恢复，是最安全的方案。但 jsdom 中 `window.location` 是特殊的只读属性，`vi.spyOn` 可能不可用，fallback 方案确保在任何环境下都能安全恢复。

### D6: cleanup() 移除策略

**决策**：一次性移除全部 38 个文件中的冗余 `cleanup()` 调用，同时移除仅包含 `cleanup()` 的 `afterEach` 块。

**理由**：`setup.ts` 全局 `afterEach` 已调用 `cleanup()`，冗余调用虽无害但增加噪音。一次性清理比渐进式更高效。

### D7: fakeTimers 迁移策略

**决策**：在每个测试文件的 `describe` 块或文件顶层启用 `vi.useFakeTimers()`，用 `vi.advanceTimersByTime()` 替换真实 `setTimeout`。不全局启用 fakeTimers（避免影响不相关的测试）。

**理由**：局部启用比全局启用更安全，避免意外影响其他时间相关的测试逻辑。

### D8: renderWithProviders 迁移策略

**决策**：检查 `renderWithProviders` 是否已支持所有需要的功能（BrowserRouter 包装等），如有不足则扩展，然后逐文件迁移 9 个手动包装的测试。

**理由**：已有工具应优先使用，扩展比重新创建更符合 DRY 原则。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 批量移除 cleanup() 可能遗漏个别文件的真实依赖 | 逐文件验证：移除后运行全量测试确认通过 |
| fakeTimers 可能与某些测试的异步逻辑冲突 | 仅在包含真实 setTimeout 的测试块内启用，不改全局 |
| window.location 的 `vi.spyOn` 在 jsdom 中可能有限制 | 若 `vi.spyOn` 不可用，改用 `vi.fn()` 赋值并在 afterEach 恢复 |
| 一次性修改 50+ 文件导致 git diff 较大 | 按功能分组提交（mock 合并 → 死代码清理 → 模式迁移） |
