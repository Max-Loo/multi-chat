## 1. Phase 0 — 免费修复（只改测试，不动组件）

- [x] 1.1 BottomNav 集成测试：将 9 处 `toHaveClass('bg-*-100')` 替换为 `toHaveAttribute('aria-current', 'page')`，删除 `toHaveClass('border-t', 'bg-background', 'h-16', 'flex', 'items-center', 'justify-around')` 等纯装饰断言
- [x] 1.2 ChatPanelHeader 测试：将 5 处 `container.querySelector('input[type="number"]')` 替换为 `screen.getByRole('spinbutton')`
- [x] 1.3 RunningChatBubble 测试：将 4 处 `container.querySelector('svg.animate-spin')` 替换为 `screen.getByRole('status')`，将 10 处 `container.querySelector('[data-testid="assistant-message"]')` 替换为 `screen.getByTestId('assistant-message')`
- [x] 1.4 ChatPanelContentDetail 测试：将 `container.querySelector('svg.animate-spin')` 替换为 `screen.getByRole('status')`，删除 `container.querySelector('div')` 和 `toHaveClass('scrollbar-none')` 等无意义断言
- [x] 1.5 FatalErrorScreen 测试：将 11 处 `container.querySelector` 替换为 `getByRole('button')`、`getByRole('group')`（details 元素）等语义查询
- [x] 1.6 运行完整测试套件验证 Phase 0 无回归

## 2. Phase 1 — 高价值组件改动

- [x] 2.1 Sidebar 组件：外层 `<div>` 改为 `<nav aria-label="主导航">`，活跃按钮添加 `aria-current="page"`
- [x] 2.2 Sidebar 测试：将 14 处 `toHaveClass` 中 12 处替换为 `aria-current` 断言或删除（保留 className 透传测试），`getByTestId('sidebar')` 改为 `getByRole('navigation')`
- [x] 2.3 NoProvidersAvailable 组件：最外层容器添加 `role="alert"`，错误图标添加 `role="img"` 和 `aria-label="错误"`
- [x] 2.4 NoProvidersAvailable 测试：将 `toHaveClass('h-16', 'w-16', 'text-destructive')` 替换为 `getByRole('img')` 和 `getByRole('alert')` 查询
- [x] 2.5 ChatPanelContentDetail 组件：滚动容器添加 `role="log"` 和 `aria-label="聊天消息"`，滚动到底部按钮添加 `aria-label`
- [x] 2.6 ChatPanelContentDetail 测试：将 `container.querySelector('div.overflow-y-auto')` 替换为 `getByRole('log')`，删除纯装饰 CSS 断言
- [x] 2.7 ThinkingSection 组件：展开/折叠按钮添加 `aria-expanded={isExpanded}`
- [x] 2.8 ThinkingSection 测试：验证 `aria-expanded` 状态变化
- [x] 2.9 DetailTitle 组件：显示名称改为语义化标题元素（`<h2>` 或 `<h3>`）
- [x] 2.10 DetailTitle 测试：将 `toHaveClass('truncate')` 替换为 `getByRole('heading')` 查询
- [x] 2.11 运行完整测试套件验证 Phase 1 无回归

## 3. Phase 2 — ChatButton 改造

- [x] 3.1 ChatButton 组件：外层 `<div>` 添加 `tabIndex={0}`、`onKeyDown`（Enter/Space 触发 onClick）、`aria-selected={isSelected}`、`data-variant={isCompact ? 'compact' : 'default'}`（不加 `role="button"`，因内部包含 DropdownMenu 触发按钮，会违反 ARIA 嵌套规则）
- [x] 3.2 ChatButton 组件：菜单触发器添加 `aria-label="更多操作"`，重命名输入框添加 `aria-label="重命名聊天"`
- [x] 3.3 ChatButton 测试：将 16 处 `toHaveClass` 中尺寸断言替换为 `data-variant` 断言，选中断言替换为 `aria-selected` 断言，`w-full` 删除
- [x] 3.4 ChatButton 测试：将 26 处 `getByTestId` 中菜单触发器替换为 `getByRole('button', { name: '更多操作' })` 查询，主元素因无 ARIA role 保留 `getByTestId`
- [x] 3.5 运行完整测试套件验证 Phase 2 无回归

## 4. Phase 3 — 横切模式与剩余清理

- [x] 4.1 骨架屏组件群：PageSkeleton、SkeletonList、SkeletonMessage、SidebarSkeleton、ModelSelectSkeleton、PanelSkeleton、Grid Skeleton 统一添加 `aria-hidden="true"` 到最外层容器
- [x] 4.2 骨架屏测试：删除对骨架屏内部 DOM 结构的 querySelector 断言
- [x] 4.3 页面 landmark 角色：ChatPage、SettingPage、CreateModel 页面的侧栏添加 `role="complementary"` 或 `<aside>`，主内容区添加 `<main>` 或 `role="main"`
- [x] 4.4 侧栏导航组件：SettingSidebar、ModelSidebar 添加 `<nav>` 和 `aria-current="page"`
- [x] 4.5 ChatPanelHeader 组件：加减列数按钮添加 `aria-label="增加列数"/"减少列数"`
- [x] 4.6 ChatBubble 组件：消息容器添加 `aria-label="用户消息"/"助手消息"`
- [x] 4.7 InitializationController 组件：加载容器添加 `role="status"` 和 `aria-live="polite"`
- [x] 4.8 ProviderCard 组件：可点击卡片添加 `tabIndex={0}`、`aria-expanded={isExpanded}`、`onKeyDown`（Enter/Space 触发 onToggle）（不加 `role="button"`，因展开后内部包含搜索输入框和文档链接等交互元素，会违反 ARIA 嵌套规则）
- [x] 4.9 ModelSelect 组件（Chat）：工具栏添加 `role="toolbar"` 和 `aria-label`，清除按钮和关闭按钮添加 `aria-label`
- [x] 4.10 Sender 组件：外层 `<div>` 改为 `<form>`，发送按钮添加 `aria-label`
- [x] 4.11 剩余 toHaveClass 清理：遍历所有测试文件，将剩余的 CSS 类断言按三层模型处理
- [x] 4.12 剩余 querySelector 清理：遍历所有测试文件，将剩余的 `container.querySelector` 替换为语义查询
- [x] 4.13 运行完整测试套件验证 Phase 3 无回归

## 5. 文档更新

- [x] 5.1 更新 BDD Guide (`src/__test__/guidelines/BDD_GUIDE.md`)：添加三层语义断言模型说明、`data-variant` 命名约定、禁止 `container.querySelector` 规则
- [x] 5.2 更新测试 README (`src/__test__/README.md`)：添加语义查询规范章节，更新示例代码
