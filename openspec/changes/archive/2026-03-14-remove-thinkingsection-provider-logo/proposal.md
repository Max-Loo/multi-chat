## Why

ThinkingSection 组件当前在折叠按钮中显示模型供应商 logo，但这个功能增加了视觉复杂度且与组件的核心职责（展示推理内容）关联性不强。移除 logo 可以简化组件接口、减少外部依赖，并提升界面一致性。

## What Changes

- 移除 `ThinkingSection` 组件中的 `provider` 属性及相关类型定义
- 移除供应商 logo 的渲染逻辑
- **BREAKING**: 调用 `ThinkingSection` 组件时不再支持传入 `provider` 属性

## Capabilities

### New Capabilities

无

### Modified Capabilities

无（此变更为纯移除操作，不涉及需求层面的修改）

## Impact

- **受影响组件**: `src/components/chat/ThinkingSection.tsx`
- **受影响调用方**: 所有使用 `ThinkingSection` 组件并传入 `provider` 属性的代码
- **外部依赖**: 移除对 `https://models.dev/logos/` 的图片请求依赖
