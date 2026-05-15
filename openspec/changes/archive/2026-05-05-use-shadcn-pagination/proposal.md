## Why

ChatBubble.tsx 中的 HistoryPager 组件手写了翻页逻辑（按钮 + 计数器），没有使用项目已有的 shadcn/ui 组件体系。作为 UI 一致性改进，应统一使用 shadcn/ui Pagination 组件，同时针对桌面应用场景（Tauri）将底层 `<a>` 元素替换为 `<button>` 以符合语义。

## What Changes

- 安装 shadcn/ui Pagination 组件到 `src/components/ui/pagination.tsx`
- 将 Pagination 组件底层 `<a>` 元素替换为 `<button>`（Tauri 桌面应用无需路由）
- 移除 PaginationPrevious/PaginationNext 中的文字标签（"Previous"/"Next"），仅保留图标
- HistoryPager 中到达边界时禁用对应方向的按钮（currentIndex === 0 时禁用 Previous，currentIndex === total - 1 时禁用 Next），两个翻页按钮始终渲染
- 重构 ChatBubble.tsx 中的 HistoryPager，使用 shadcn Pagination 子组件替代手写实现
- 删除 ChatBubble.tsx 中不再需要的 ChevronLeft/ChevronRight 直接导入（改为由 Pagination 组件内部使用）

## Capabilities

### New Capabilities

- `shadcn-pagination`: 基于 shadcn/ui 的 Pagination 组件，针对桌面应用定制（button 元素、纯图标模式）

### Modified Capabilities

_无现有规格需要修改。_

## Impact

- **新增文件**: `src/components/ui/pagination.tsx`（shadcn 组件，需修改底层元素）
- **修改文件**: `src/components/chat/ChatBubble.tsx`（HistoryPager 重构、import 调整）
- **依赖**: 无新增外部依赖，Pagination 使用已有的 lucide-react 和 buttonVariants
