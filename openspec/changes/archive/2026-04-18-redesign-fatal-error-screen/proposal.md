## Why

FatalErrorScreen 的错误信息展示区域过小、按钮排布过于紧凑，导致页面视觉上缺乏呼吸感，用户难以快速定位和理解错误内容。作为应用初始化失败时的唯一界面，需要提供更清晰、更从容的信息展示。

## What Changes

- 增大错误 Alert 组件的内边距和行间距，让错误信息更容易阅读
- 重新设计按钮区布局：刷新按钮独占一行，用分割线与危险操作（主密钥恢复、重置数据）分隔开
- 危险操作按钮横向并排排列，增加按钮之间的间距

## Capabilities

### New Capabilities

（无 — 本次为纯 UI 布局优化，不引入新功能）

### Modified Capabilities

（无 — 不涉及行为层面的需求变更，仅调整视觉呈现）

## Impact

- **影响文件**：`src/components/FatalErrorScreen/index.tsx`
- **依赖**：可能需要引入 `Separator` 组件（shadcn/ui）
- **兼容性**：不影响任何 API、数据结构或外部依赖
