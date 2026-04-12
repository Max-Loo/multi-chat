## Context

`next-themes` 在 commit `907680a`（"修改前端组件为 shadcn/ui"）中作为 shadcn/ui Sonner 组件模板的附带依赖安装。当前项目中唯一的使用点是 `src/components/ui/sonner.tsx`，通过 `useTheme()` 获取主题值传给 Sonner 的 `theme` prop。

项目是 Tauri 桌面应用，不需要 `next-themes` 的 SSR 兼容能力（`next-themes` 的核心价值在于 Next.js SSR 场景下避免主题闪烁）。后续暗色模式功能将通过自定义方案实现（见 `tailwind-dark-mode` 变更计划）。

## Goals / Non-Goals

**Goals:**

- 移除 `next-themes` 依赖，减少项目不必要的依赖项
- Sonner 组件在移除后仍能正确检测主题状态

**Non-Goals:**

- 不实现完整的主题切换机制（属于 `tailwind-dark-mode` 变更范围）
- 不修改 Sonner 组件的样式或行为
- 不引入新的外部依赖替代 `next-themes`

## Decisions

### 决策 1：使用 DOM 检测获取主题状态

**选择**：在 `sonner.tsx` 中通过检测 `<html>` 元素的 `class` 判断当前主题

**替代方案**：
- 引入另一个主题库（如 `@vueuse/core` 的 React 版）：引入新依赖，违背移除依赖的初衷
- 创建全局 React Context 管理主题：过度设计，暗色模式变更会提供自己的主题管理方案

**理由**：当前只需要让 Sonner 知道当前是 light 还是 dark，通过 `document.documentElement.classList.contains('dark')` 即可判断。如果 html 上没有 `.dark` class，默认为 light。这不需要任何外部依赖，且与后续暗色模式方案兼容（无论后续用什么方案管理主题，只要在 html 上切换 `.dark` class，Sonner 就能正确检测）。

**实现方式**：

```typescript
// sonner.tsx 中的主题检测逻辑
const getTheme = (): "light" | "dark" | "system" => {
  if (typeof document === "undefined") return "system";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};
```

由于主题切换不是高频操作，使用简单的状态检测即可，无需 `MutationObserver` 等复杂机制。后续暗色模式变更会提供完整的主题管理方案，届时可按需集成。

### 决策 2：移除而非替换

**选择**：直接移除 `next-themes`，不引入任何替代库

**理由**：项目唯一的使用场景（Sonner 主题检测）可以用 3 行代码自行实现，不值得保留一个 30KB+ 的库。

## Risks / Trade-offs

- **主题切换时 Sonner 可能不会实时响应**：如果后续暗色模式方案使用非 class 切换方式（如 data 属性），需要同步更新检测逻辑 → 风险低，后续变更会处理
