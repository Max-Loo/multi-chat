## 1. CSS 变量调整

- [x] 1.1 调整 `src/main.css` `.dark` 块中 `--sidebar` 值从 `oklch(0.230 0 0)` 改为 `oklch(0.22 0 0)`
- [x] 1.2 ~~在 `src/main.css` `@layer base` 中添加 `.dark img.provider-logo` 规则~~ 已完成：ProviderLogo 滤镜规则已作为独立 CSS 规则添加（浅色 drop-shadow + 暗色 invert），位于 `@layer base` 之前

## 2. 侧边栏背景色统一

- [x] 2.1 在 `src/pages/Chat/index.tsx` 的侧边栏容器 div 上添加 `bg-sidebar` class
- [x] 2.2 在 `src/pages/Model/CreateModel/index.tsx` 的侧边栏容器 div 上添加 `bg-sidebar` class
- [x] 2.3 在 `src/pages/Setting/index.tsx` 的侧边栏容器 div 上添加 `bg-sidebar` class

## 3. ProviderLogo 暗色模式支持

- [x] 3.1 在 `src/components/ProviderLogo/index.tsx` 的 `<img>` 元素上添加 `provider-logo` class，移除 inline `filter` 属性（drop-shadow 已迁入 CSS）

## 4. 验证

- [x] 4.1 验证暗色模式下三个页面侧边栏背景亮度一致，与主内容区有层级差
- [x] 4.2 验证暗色模式下 ProviderLogo 图片反色显示清晰可辨
- [x] 4.3 验证浅色模式下侧边栏和 ProviderLogo 无视觉变化
