## Why

暗色模式的背景色（oklch 0.145）过深而前景色（oklch 0.985）接近纯白，导致对比度约 15:1，远超 WCAG AAA 要求的 7:1。过高的对比度产生光晕效应（Halation），长时间使用造成视疲劳。主流暗色模式设计（macOS、VS Code、GitHub）通常控制在 8:1~12:1 之间。此外，代码中存在 2 处硬编码的 `dark:` 前缀，应统一使用 CSS 变量管理。

## What Changes

- 调整 `.dark` 块中的 CSS 变量值：微提背景亮度、降低前景亮度，将主对比度降至 9:1~10:1 的舒适区间
- 同步调整导航栏相关变量（nav-chat、nav-model、nav-setting 及其 muted 变体）
- 移除 `Title.tsx` 中 `dark:bg-orange-600` 和 `alert.tsx` 中 `dark:border-destructive` 共 2 处硬编码的 `dark:` Tailwind 前缀，改用 CSS 变量实现
- 确保调整后所有文字/背景组合仍满足 WCAG AA（4.5:1）对比度要求

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `theme-switching`: 暗色模式色彩值从高对比度方案调整为舒适对比度方案，新增暗色模式色彩规范要求

## Impact

- **CSS 变量**：`src/main.css` 中 `.dark {} 块的全部变量值
- **组件代码**：`src/pages/Chat/components/Panel/Detail/Title.tsx` 和 `src/components/ui/alert.tsx`（移除硬编码 `dark:` 前缀）
- **视觉影响**：全局暗色模式外观变化，不影响浅色模式
- **无 API/依赖变更**
