## Context

ChatBubble.tsx 中的 HistoryPager 组件用于在消息的编辑/重新生成历史版本之间切换导航。当前实现手动编写了翻页按钮（使用 `Button` + `lucide-react` 图标），逻辑和样式与 shadcn/ui 组件体系分离。项目已广泛使用 shadcn/ui（Button、Card、Textarea 等约 27 个组件），Pagination 是唯一缺失的基础 UI 组件。

shadcn/ui Pagination 组件默认使用 `<a>` 元素设计用于 Web 路由场景。本项目为 Tauri 桌面应用，所有交互通过回调函数驱动，不需要 href 路由。

## Goals / Non-Goals

**Goals:**

- 统一 UI 组件来源，HistoryPager 使用 shadcn/ui Pagination 子组件构建
- 将 Pagination 底层元素从 `<a>` 改为 `<button>` 以匹配桌面应用的交互模式
- 边界状态（首/末页）采用 disabled 禁用按钮，按钮始终渲染
- 保持 HistoryPager 现有功能不变（翻页、计数器显示、回调通知）

**Non-Goals:**

- 不改变 HistoryPager 的外部接口（props 不变）
- 不引入完整的页码导航（仅保留前/后 + 计数器）
- 不修改 ChatBubble 的其他部分

## Decisions

### D1: 底层元素使用 `<button>` 替代 `<a>`

shadcn Pagination 默认的 `PaginationLink` 使用 `<a>` 标签，配合 `href` 属性用于页面路由。Tauri 桌面应用中所有交互都是事件驱动的，`<a>` 标签语义不正确。

**替代方案**: 保持 `<a>` + onClick — 语义不正确，无 `href` 的 `<a>` 不符合无障碍标准。

**决策**: 在安装 pagination.tsx 后，将 `PaginationLink` 底层元素从 `<a>` 改为 `<button>`，并添加 `variant` prop 默认为 `"ghost"`。

### D2: 边界状态使用禁用

到达边界时禁用对应方向的按钮（disabled），两个翻页按钮始终渲染，保持控件宽度稳定。

**实现**: `PaginationPrevious` 在 `currentIndex === 0` 时 disabled，`PaginationNext` 在 `currentIndex === total - 1` 时 disabled。

### D3: 纯图标模式，移除文字标签

PaginationPrevious/PaginationNext 默认包含 "Previous"/"Next" 文字标签。HistoryPager 场景下只需要图标，通过修改 pagination.tsx 中的组件去掉文字标签。

### D4: 计数器保留为自定义元素

shadcn Pagination 没有内置的 "1/3" 计数器组件。在 HistoryPager 中使用 `<PaginationItem>` 包裹自定义 `<span>` 来显示计数，保持与 Pagination 布局的一致性。

## Risks / Trade-offs

- **[偏离 shadcn 原版]** → 修改 pagination.tsx 后与 shadcn 原版有差异，未来手动更新 shadcn 组件时需注意合并冲突。缓解：修改范围小且集中在底层元素，注释标注修改点。
- **[hidden 导致布局跳动]** → 隐藏按钮可能导致翻页控件宽度变化。缓解：为计数器 `<span>` 设置 `min-width` 保持居中稳定。
