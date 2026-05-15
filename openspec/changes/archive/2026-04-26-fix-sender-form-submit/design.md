## Context

Sender 组件（`src/pages/Chat/components/Panel/Sender.tsx`）的外层容器在近期重构中从 `<div>` 改为 `<form>`（第 197 行），以提升语义化。但未同步添加 `onSubmit` 处理器。

HTML 规范规定 `<button>` 在 `<form>` 内默认 `type="submit"`。SendButton 组件（第 253 行）位于 `<form>` 内部，点击时既触发 `onClick`（执行 `sendMessage`），也触发浏览器默认表单提交行为（页面刷新）。

## Goals / Non-Goals

**Goals:**

- 阻止 Sender 表单的浏览器默认提交行为，消除页面刷新 bug

**Non-Goals:**

- 不改变发送逻辑
- 不改变表单语义化结构（保留 `<form>`）
- 不为 SendButton 添加 `type="button"` 属性（与 `onSubmit` 方案互斥，二选一即可）

## Decisions

**决策：使用 `onSubmit={(e) => e.preventDefault()}` 而非为按钮添加 `type="button"`**

- 方案 A（采纳）：在 `<form>` 上添加 `onSubmit={(e) => e.preventDefault()}`
- 方案 B（排除）：为 `<SendButton>` 添加 `type="button"` 属性

理由：方案 A 是防御性编程——无论未来表单内新增什么按钮，都不会意外触发提交。方案 B 需要逐个按钮设置 `type`，容易遗漏。

## Risks / Trade-offs

无显著风险。`e.preventDefault()` 是纯防御性修复，不改变现有功能行为。
