## 1. 安装并定制 Pagination 组件

- [x] 1.1 运行 `npx shadcn@latest add pagination` 安装 pagination 组件到 `src/components/ui/pagination.tsx`
- [x] 1.2 将 `PaginationLink` 底层元素从 `<a>` 改为 `<button>`，移除 `href` 相关 props，确保支持 `onClick` 和 `disabled`
- [x] 1.3 移除 `PaginationPrevious` 中的 "Previous" 文字标签和 `PaginationNext` 中的 "Next" 文字标签，仅保留图标
- [x] 1.4 调整 `PaginationPrevious`/`PaginationNext` 的 size 为 `icon` 模式，className 改为 `size-7` 以匹配现有按钮尺寸

## 2. 重构 HistoryPager

- [x] 2.1 修改 HistoryPager 导入，从 `@/components/ui/pagination` 引入 Pagination 子组件，移除直接导入的 `ChevronLeft`/`ChevronRight`
- [x] 2.2 用 Pagination + PaginationContent + PaginationItem 重构 HistoryPager 的 JSX 结构
- [x] 2.3 实现边界禁用逻辑：`currentIndex === 0` 时 PaginationPrevious disabled，`currentIndex === total - 1` 时 PaginationNext disabled
- [x] 2.4 在两个翻页按钮之间用 PaginationItem 包裹 `<span>` 显示 "n/m" 计数器

## 3. 清理与验证

- [x] 3.1 移除 ChatBubble.tsx 中不再需要的 `ChevronLeft`、`ChevronRight` 导入（如果仅被 HistoryPager 使用）
- [x] 3.2 运行 `pnpm tsc` 确认类型检查通过
- [x] 3.3 运行 `pnpm lint` 确认代码规范通过
- [ ] 3.4 手动验证聊天页面的历史翻页功能正常（编辑后翻页、重新生成后翻页）
