## Why

导出密钥对话框当前采用双阶段流程（安全警告确认 → 展示密钥），增加了不必要的操作步骤。密钥管理功能位于设置页面深处，误触风险极低，安全警告对用户而言是冗余的摩擦。

## What Changes

- 移除导出密钥的安全警告确认阶段，点击按钮直接获取并展示密钥
- 对话框中增加加载态反馈（获取密钥期间）
- 简化 `exportState` 状态模型：从三态 (`null | "warning" | string`) 简化为两态 (`null | string`)

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `app-master-key`: 导出密钥对话框交互流程变更，移除安全警告二次确认

## Impact

- 组件：`src/pages/Setting/components/KeyManagementSetting/index.tsx`
- 国际化：`src/locales/{en,zh,fr}/setting.json`（可移除 `exportSecurityWarning` 翻译 key，或保留备用）
