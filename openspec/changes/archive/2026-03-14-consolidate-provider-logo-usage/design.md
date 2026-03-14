## Context

项目中已有 `getProviderLogoUrl` 工具函数（`src/utils/providerUtils.ts`），但两处组件仍在使用内联 URL 拼接：
- `ModelSidebar.tsx` 第 107 行
- `ModelProviderDisplay.tsx` 第 24 行

## Goals / Non-Goals

**Goals:**
- 消除重复的 URL 拼接逻辑
- 统一使用 `getProviderLogoUrl` 工具函数
- 提高代码可维护性

**Non-Goals:**
- 不改变任何 UI 行为或样式
- 不修改 `getProviderLogoUrl` 函数本身
- 不引入新的组件或抽象

## Decisions

**决策 1：直接替换内联 URL**

选择直接将内联 URL 替换为 `getProviderLogoUrl` 调用，而非创建新组件。

理由：
- 改动范围最小
- 两个组件的 logo 显示逻辑简单，无需封装
- `ProviderLogo` 组件适用于需要渐进显示和降级处理的场景，这两个组件不需要

## Risks / Trade-offs

无显著风险。这是纯重构，不改变任何运行时行为。
