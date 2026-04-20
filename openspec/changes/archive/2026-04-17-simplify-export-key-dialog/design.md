## Context

当前导出密钥对话框使用双阶段 AlertDialog：先展示安全警告让用户确认，确认后才获取并展示密钥。`exportState` 状态模型为 `null | "warning" | string` 三态。

涉及的组件文件：`src/pages/Setting/components/KeyManagementSetting/index.tsx`

## Goals / Non-Goals

**Goals:**
- 点击导出按钮后直接获取密钥并展示，减少操作步骤
- 获取密钥期间提供明确的加载态反馈
- 简化状态模型，降低代码复杂度

**Non-Goals:**
- 不改变密钥导出的底层逻辑（`exportMasterKey()` 不变）
- 不改变复制到剪贴板的逻辑
- 不改变导入和重置功能的交互

## Decisions

**1. 状态模型简化为两态 `null | string`**

移除 `"warning"` 中间态。点击按钮直接调用 `handleExportKey`，获取成功后 `exportState` 直接设为密钥字符串。

理由：三态模型仅服务于安全警告确认阶段，移除后状态管理更直观。

**2. 加载态通过 `isFetchingKey` 已有状态控制**

复用已有的 `isFetchingKey` 状态：按钮点击时设为 true，对话框内展示 loading 指示（如禁用输入框 + 按钮显示 "..."），获取完成或失败后重置。

**3. 按钮点击直接触发获取 + 打开对话框**

将按钮 `onClick` 改为同时调用 `handleExportKey()` 并设置对话框为打开状态。对话框打开时如果密钥尚未就绪则展示加载态。

## Risks / Trade-offs

- [误触风险] → 低风险：该功能位于设置页面深处，需要明确导航才能到达。桌面应用无"误触后密钥泄露给第三方"的场景。
