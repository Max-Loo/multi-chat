## Why

`KeyManagementSetting` 组件中的导出密钥对话框缺少 `AlertDialogDescription`，导致 Radix UI 在控制台输出无障碍访问警告。所有使用 `AlertDialogContent` 的地方都必须包含 `AlertDialogDescription`，以满足屏幕阅读器的 `aria-describedby` 要求。

## What Changes

- 在 `KeyManagementSetting/index.tsx` 的导出密钥对话框中添加 `AlertDialogDescription`
- 确保所有 `AlertDialogContent` 实例都包含对应的 `AlertDialogDescription`

## Capabilities

### New Capabilities

_无_

### Modified Capabilities

_无_

## Impact

- **受影响文件**：`src/pages/Setting/components/KeyManagementSetting/index.tsx`
- **依赖**：无新增依赖，使用已有的 shadcn/ui `AlertDialogDescription` 组件
- **影响范围**：仅消除控制台警告，不改变任何功能行为
