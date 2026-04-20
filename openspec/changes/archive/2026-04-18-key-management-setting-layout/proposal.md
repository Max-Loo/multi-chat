## Why

密钥管理设置页面（KeyManagementSetting）中，每个功能卡片的按钮应竖直居中于整个卡片容器内，而非仅与描述文字水平对齐。将标题和描述作为左侧内容区，按钮作为右侧元素并在整个卡片内竖直居中，可提升视觉平衡感和空间利用率。

## What Changes

- 将密钥导出卡片和重置数据卡片的内部布局改为：卡片整体使用 flex-row items-center，左侧为标题+描述（flex-col），右侧按钮在整个卡片高度内竖直居中
- 移除按钮的 `w-full` 响应式宽度，改为自适应宽度
- 调整间距和对齐方式以适配新布局

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

无规格级别的需求变更。本次改动仅涉及布局样式调整，不改变功能行为。

## Impact

- **影响文件**: `src/pages/Setting/components/KeyManagementSetting/index.tsx`
- **影响范围**: 仅 UI 布局，无 API、数据流或状态变更
- **风险**: 低，纯样式调整，不影响功能逻辑
