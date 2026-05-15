## Context

在测试语义化查询迁移（commit 范围）中，`responsive-layout-switching.integration.test.tsx` 的 3 处 `querySelector` 被遗漏。这些调用使用 `nav:not([aria-label="主导航"])` CSS 伪类来区分 Sidebar 导航和 BottomNav 导航，与"消除 querySelector"的迁移目标矛盾，且高度脆弱。

当前状态：
- BottomNav `<nav>` 无 `aria-label`，无法用 `getByRole('navigation', { name })` 定位
- Sidebar `<nav>` 已有 `aria-label="主导航"`
- 已有 `openspec/specs/bottom-navigation/spec.md` 中第 166 行要求 `aria-label="主导航"`，与 Sidebar 冲突（应改为"底部导航"）

## Goals / Non-Goals

**Goals:**
- 为 BottomNav 的 `<nav>` 添加 `aria-label="底部导航"`，使其可被语义化查询定位
- 将集成测试中 3 处 `querySelector` 替换为 `screen.queryByRole('navigation', ...)` 语义化查询
- 修正已有 spec 中 `aria-label` 与 Sidebar 的冲突

**Non-Goals:**
- 不重构其他文件中残留的 querySelector（超出本次范围）
- 不处理审查报告中低优先级的发现
- 不引入新的 i18n key（aria-label 直接硬编码，与 Sidebar 的 "主导航" 保持一致策略）

## Decisions

**决策 1：aria-label 值使用"底部导航"而非"主导航"**

理由：Sidebar 已使用 `aria-label="主导航"`。同一页面若存在多个 `<nav>` 且 `aria-label` 相同，屏幕阅读器无法区分。使用"底部导航"与视觉位置对应，用户直觉理解。

替代方案：使用 i18n key — 但 Sidebar 的 "主导航" 同样硬编码（见 ChatSidebar），保持一致。

**决策 2：直接硬编码而非 i18n**

理由：审查报告 #10 指出项目内已存在 i18n 与硬编码混用。BottomNav 的 `aria-label` 与 Sidebar 保持同级别处理，后续统一国际化时再批量迁移。

**决策 3：测试查询策略**

- "存在底部导航" → `screen.getByRole('navigation', { name: '底部导航' })`
- "不存在底部导航" → `screen.queryByRole('navigation', { name: '底部导航' }) === null`

替代方案：使用 `within` + `getByRole` 限定查询范围 — 但 `screen.getByRole` 已足够精确（通过 name 区分），无需限定范围。

## Risks / Trade-offs

- **[风险] aria-label 硬编码** → 后续统一国际化时需批量修改，但当前与项目现有策略一致
- **[风险] 已有 spec 与实际行为不一致** → 已有 spec 第 166 行写 `aria-label="主导航"` 但实际代码未设置，本次一并修正
