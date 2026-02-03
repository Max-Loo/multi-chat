## Why

当前聊天面板的「滚动到底部按钮」使用蓝色主题样式，与发送按钮的深灰色圆形设计不一致，造成视觉风格不统一。此外，按钮位置设置为 `bottom-24`，在某些情况下可能被发送框（高度约 88px）遮挡，影响用户体验。现在需要统一按钮设计风格并调整位置以避免遮挡。

## What Changes

- **滚动到底部按钮样式重构**：将蓝色主题改为与发送按钮一致的深灰色圆形设计
  - 改用 `bg-gray-900 text-white` 作为主色调
  - 保持圆形设计 `rounded-full`
  - 添加阴影效果 `shadow-md hover:shadow-lg`
  - 添加 hover 状态 `hover:bg-gray-800`
  - 统一尺寸为 `h-10 w-10`（与发送按钮一致）
- **位置调整**：将按钮位置从 `bottom-24` 调整为更高的位置，避免被发送框遮挡
  - 发送框容器高度约为 88px（`py-3` + `min-h-20` + 边框）
  - 建议调整为 `bottom-[100px]` 或更高，确保按钮始终可见
- **加载状态样式统一**：调整发送中的加载动画，使用灰色边框而非蓝色，保持与发送按钮的视觉一致性

## Capabilities

### New Capabilities
无。此变更是纯 UI 样式优化，不引入新的功能能力。

### Modified Capabilities
无。此变更不涉及现有功能的需求变更，仅修改实现层面的样式细节。现有 spec 中的聊天功能需求保持不变。

## Impact

- **受影响的组件**：
  - `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/components/ChatPanelContentDetail/index.tsx`（第 154-172 行）
- **依赖**：
  - shadcn/ui Button 组件（已存在）
  - lucide-react ArrowDown 图标（已存在）
- **测试影响**：无需额外的功能测试，建议进行视觉回归测试确保样式符合预期
