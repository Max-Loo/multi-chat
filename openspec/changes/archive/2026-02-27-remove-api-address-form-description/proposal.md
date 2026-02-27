## Why

移除 ModelConfigForm 中「API 地址」表单项下方的地址预览文本。该预览信息是冗余的，用户已经在输入框中看到当前输入的 API 地址，额外的预览不仅没有提供额外价值，还增加了界面的视觉复杂度。

## What Changes

- 移除 `ModelConfigForm.tsx` 中 `apiAddress` 表单字段的 `FormDescription` 组件及其内容
- 移除未使用的 `FormDescription` 组件导入

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

这是一个简单的 UI 实现，不涉及功能规格的变更。

## Impact

- **受影响的文件**：
  - `src/pages/Model/components/ModelConfigForm.tsx`
- **移除的组件**：
  - `FormDescription`（来自 shadcn/ui form 组件）
- **用户体验**：
  - API 地址表单项下方不再显示地址预览，界面更简洁
