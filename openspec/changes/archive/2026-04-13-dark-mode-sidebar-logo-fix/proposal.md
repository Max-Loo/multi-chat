## Why

暗色模式下存在两个视觉问题：一是各页面（Chat、Model、Setting）的内容侧边栏没有显式背景色，透出主背景 `--background`（oklch 0.175）显得过深，与全局图标导航栏的 `--sidebar`（oklch 0.230）存在明显亮度断层；二是 `ProviderLogo` 组件使用的 SVG logo 为深色设计，在暗色背景上形成"黑底黑标"，无法辨识。

## What Changes

- 给 Chat、Model、Setting 三个页面的内容侧边栏容器添加 `bg-sidebar` 背景色，统一使用 `--sidebar` 变量（oklch 0.230），通过 `border-border` 边框进行区域区分
- 调整 `--sidebar` 暗色值，从 oklch(0.230) 微调到舒适区间（约 0.22），与主内容背景形成适度层级差
- 为 `ProviderLogo` 组件的 `<img>` 元素添加暗色模式反色处理（`invert(1) hue-rotate(180deg)`），使深色 logo 在暗色背景上清晰可辨

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `theme-switching`: 新增暗色模式下侧边栏统一背景色规范，所有页面侧边栏使用 `bg-sidebar` 而非透出主背景
- `provider-logo-display`: 新增暗色模式 logo 反色显示要求，确保 logo 在深色背景下清晰可辨

## Impact

- **CSS 变量**：`src/main.css` 中 `.dark` 块的 `--sidebar` 变量值
- **组件代码**：Chat、Model、Setting 三个页面的侧边栏容器组件（各加 `bg-sidebar` class）
- **组件代码**：`src/components/ProviderLogo/index.tsx`（img 元素添加暗色反色样式）
- **视觉影响**：暗色模式下侧边栏背景变亮、logo 变清晰，不影响浅色模式
- **无 API/依赖变更**
