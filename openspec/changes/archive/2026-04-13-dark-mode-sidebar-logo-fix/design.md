## Context

当前暗色模式基于 Tailwind CSS 变量实现，通过 `.dark` class 切换。侧边栏架构分为两层：
1. **全局图标导航栏**（`src/components/Sidebar/index.tsx`）：使用 `bg-sidebar`
2. **页面内容侧边栏**（Chat/Model/Setting 各自的容器）：无显式背景，透出 `--background`

两者在暗色模式下存在亮度断层（0.230 vs 0.175），且各页面侧边栏与主内容区无法区分。

`ProviderLogo` 组件加载来自 `models.dev` 的 SVG logo，这些 logo 默认为深色设计，暗色背景下不可见。

## Goals / Non-Goals

**Goals:**
- 统一暗色模式下侧边栏区域的背景亮度，消除亮度断层
- 使 ProviderLogo 在暗色模式下清晰可辨

**Non-Goals:**
- 不修改浅色模式的任何视觉表现
- 不引入新的 CSS 变量或设计系统 token
- 不修改 logo 源 URL 或加载机制

## Decisions

### Decision 1: 页面侧边栏使用 `bg-sidebar` 而非新建变量

**选择**: 复用已有的 `--sidebar` CSS 变量，给三个页面的侧边栏容器加 `bg-sidebar` class。

**替代方案**: 创建新变量如 `--page-sidebar` 区分全局导航栏和页面侧边栏。

**理由**: 用户明确要求三者（全局导航、页面侧边栏）使用相同亮度，复用 `--sidebar` 最简单。边框 `border-border` 已在各容器上使用，无需额外区分。

**影响文件**:
- `src/pages/Chat/index.tsx` — 侧边栏容器加 `bg-sidebar`
- `src/pages/Model/CreateModel/index.tsx` — 侧边栏容器加 `bg-sidebar`
- `src/pages/Setting/index.tsx` — 侧边栏容器加 `bg-sidebar`

### Decision 2: `--sidebar` 暗色值微调至 oklch(0.22 0 0)

**选择**: 将 `--sidebar` 从 `oklch(0.230 0 0)` 调整为 `oklch(0.22 0 0)`。

**理由**: 0.22 与主内容背景 0.175 之间有可感知的层级差（约 0.045 oklch），但不会太亮导致刺眼。与 VS Code、GitHub 等主流暗色主题的侧边栏亮度一致。

**影响文件**: `src/main.css` `.dark` 块

### Decision 3: Logo 滤镜通过纯 CSS 规则管理

**选择**: 将 `<img>` 的 `filter` 从 inline style 迁出为 CSS class，通过 `src/main.css` 全局规则控制浅色/暗色滤镜。

**替代方案**:
- 在组件内通过 `useTheme` 判断添加 inline style → 引入运行时开销，且 inline style 优先级高于 CSS 选择器，无法被 `.dark` 规则覆盖
- 使用 Tailwind `dark:` 变体 → 需要在 className 中处理，增加组件复杂度

**理由**: 当前 `<img>` 的 inline `style={{ filter: 'drop-shadow(...)' }}` 会阻止 CSS 选择器生效（inline style 优先级最高）。必须先移除 inline filter，改为 CSS class：
```css
/* 浅色模式：保留阴影 */
img.provider-logo {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1));
}
/* 暗色模式：反色 + 色相补偿 */
.dark img.provider-logo {
  filter: invert(1) hue-rotate(180deg);
}
```

组件只需给 `<img>` 添加 `provider-logo` class，不感知主题状态，零运行时开销。

**影响文件**: `src/main.css`、`src/components/ProviderLogo/index.tsx`

### Decision 4: Logo 反色使用 `invert(1) hue-rotate(180deg)` 组合

**选择**: 使用 `invert(1) hue-rotate(180deg)` 而非 `brightness(0) invert(1)` 或纯 `invert(1)`。

**替代方案**:
- `brightness(0) invert(1)` — 统一变纯白，完全丢失品牌色
- 仅 `invert(1)` — 简单反色，但彩色 logo 变互补色

**理由**: `hue-rotate(180deg)` 补偿 `invert` 造成的色相偏移，使彩色 logo 在反色后尽量保持原有色相感知。例如 OpenAI 的绿色 logo 反色后仍偏绿而非变紫。

## Risks / Trade-offs

- **[品牌色偏移]** `invert(1) hue-rotate(180deg)` 对白色或灰色 logo 效果完美，但对某些彩色 logo 可能仍有轻微色偏 → 40px 小尺寸下感知极弱，可接受
- **[侧边栏背景统一]** 统一使用 `--sidebar` 后，如果未来需要全局导航和页面侧边栏不同亮度，需要引入新变量 → 当前需求明确一致，未来按需拆分
- **[图片滤镜性能]** CSS filter 在大量 logo 同时渲染时可能有性能影响 → ProviderLogo 有 React.memo 缓存，且单页面 logo 数量有限（通常 < 20），无性能问题
