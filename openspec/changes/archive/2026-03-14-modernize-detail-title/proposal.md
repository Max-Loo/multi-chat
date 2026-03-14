## Why

当前聊天面板标题（DetailTitle）采用纯文本格式显示模型信息（`供应商 | 模型名 | 昵称`），存在以下问题：

1. **视觉层次缺失**：所有信息权重相同，用户难以快速识别关键信息
2. **长文本溢出**：用户自定义昵称可能很长，导致布局破坏
3. **缺乏交互性**：无法获取更详细的信息

现在改进是因为：项目已有 `ProviderLogo` 组件可以利用，shadcn Tooltip 组件可快速集成。

## What Changes

- 添加供应商 Logo 显示，增强品牌识别
- 简化主显示区域：仅展示 Logo + 昵称
- 新增 Tooltip 交互：hover 时显示完整模型信息（供应商、模型名、昵称）
- 添加文本截断处理：防止长昵称溢出布局
- 状态 Badge 仅在异常情况（禁用/删除）时显示

## Capabilities

### New Capabilities

- `detail-title-tooltip`: 聊天面板标题的 Tooltip 交互能力，包括：
  - hover/tap 显示完整模型信息
  - 键盘可访问性支持
  - 文本截断与溢出处理

### Modified Capabilities

无现有 spec 需要修改。

## Impact

**受影响文件**：
- `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/components/DetailTitle.tsx`

**新增依赖**：
- `@radix-ui/react-tooltip`（通过 `npx shadcn@latest add tooltip` 安装）
- `src/components/ui/tooltip.tsx`（shadcn Tooltip 组件）

**复用组件**：
- `src/components/ProviderLogo/index.tsx`
- `src/components/ui/badge.tsx`
