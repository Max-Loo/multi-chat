## Context

ThinkingSection 组件当前支持通过 `provider` 属性显示模型供应商 logo。该功能依赖于外部图片资源 (`https://models.dev/logos/`)，且增加了组件的接口复杂度。

**当前实现**:
- `ThinkingSectionProps` 接口包含可选的 `provider?: ModelProvider` 属性
- 当 `provider` 存在时，渲染 `<img>` 标签加载供应商 logo
- `ModelProvider` 接口仅包含 `providerKey: string` 字段

## Goals / Non-Goals

**Goals:**
- 简化 `ThinkingSection` 组件接口
- 移除对外部图片资源的依赖
- 减少不必要的视觉元素

**Non-Goals:**
- 不改变组件的核心功能（展示推理内容、折叠/展开交互）
- 不影响加载动画（`animate-pulse-fade`）在标题上的应用

## Decisions

### 1. 直接移除 provider 属性及相关代码

**理由**: 这是一个简单的移除操作，无需复杂的重构策略。直接删除相关代码是最干净的方式。

**涉及修改**:
- 移除 `ModelProvider` 接口定义
- 从 `ThinkingSectionProps` 中移除 `provider` 属性
- 移除组件参数中的 `provider` 解构
- 移除 `<img>` 渲染逻辑

### 2. 保留加载动画效果

**理由**: 加载状态 (`loading`) 的脉冲动画效果仍然应用于标题文字，用于指示 AI 正在推理中。

## Risks / Trade-offs

**Risk**: 调用方代码可能仍在传入 `provider` 属性
→ **Mitigation**: TypeScript 编译时会报告多余属性错误（如果开启严格模式），便于定位调用方

**Trade-off**: 失去供应商视觉标识
→ **Acceptance**: 供应商信息与推理内容展示无关，移除后界面更简洁
