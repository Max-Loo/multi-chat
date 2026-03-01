# 提案：添加瀑布流布局

## Why

当前的 ProviderGrid 组件使用 CSS Grid 布局，在供应商卡片高度不一致时（展开/折叠状态不同）会产生大量垂直空白区域，影响空间利用率和视觉美观度。通过引入瀑布流布局，可以更紧凑地排列卡片，提升用户体验和空间利用率。

## What Changes

- 引入 `react-masonry-css` 库作为依赖
- 将 `ProviderGrid.tsx` 的布局从 CSS Grid 替换为 Masonry 瀑布流布局
- 保持响应式列数配置（移动端 1 列，平板 2 列，桌面 3 列）
- 保持卡片展开/折叠的交互功能不变

## Capabilities

### New Capabilities
- `masonry-layout`: 为卡片列表组件提供瀑布流布局能力，支持响应式列数配置和动态高度自适应

### Modified Capabilities
- `model-provider-display`: 修改"支持响应式布局"需求的实现方式（从 CSS Grid 改为 Masonry），但不改变业务需求本身

## Impact

**受影响的代码**：
- `src/pages/Setting/components/GeneralSetting/components/ModelProviderSetting/components/ProviderGrid.tsx`

**新增依赖**：
- `react-masonry-css` (npm 包)

**不受影响**：
- `ProviderCard.tsx` 组件保持不变
- 响应式断点行为保持一致
- 用户交互功能（展开/折叠）保持不变
