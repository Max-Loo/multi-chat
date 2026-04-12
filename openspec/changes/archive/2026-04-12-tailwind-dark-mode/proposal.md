## Why

项目使用 shadcn/ui + Tailwind CSS v4，`main.css` 中已有完整的 `:root` / `.dark` CSS 变量定义和 `@custom-variant dark` 配置，但缺少主题切换机制。同时业务代码中存在约 50 处硬编码色值（`bg-white`、`border-gray-200`、`bg-blue-100!` 等），分布在约 20 个源文件中，绕过了 CSS 变量体系，导致暗色模式基础设施虽已就绪却无法生效。需要将硬编码色值统一迁移到语义变量，并基于 Tailwind CSS 自建主题管理方案，不引入额外依赖。

## What Changes

- 创建基于 React Context 的 `ThemeProvider` 和 `useTheme` Hook，管理 `.dark` class 切换、localStorage 持久化和系统偏好监听，所有消费组件共享单一状态源
- 在设置页通用设置中新增主题选择 UI（浅色 / 深色 / 跟随系统）
- 将约 20 个业务组件中的约 50 处硬编码色值替换为 shadcn/ui 语义变量（如 `bg-white` → `bg-background`，`border-gray-200` → `border-border`）
- 在 `main.css` 中新增导航主题色 CSS 变量对（`--nav-chat`、`--nav-model`、`--nav-setting` 及其暗色值），替换 `navigation.tsx` 中的 `blue-*`/`emerald-*`/`violet-*` 硬编码和 `!important`

## Capabilities

### New Capabilities

- `theme-switching`: 主题切换机制——自定义 useTheme Hook、localStorage 持久化、系统偏好跟随、设置页主题选择 UI

### Modified Capabilities

- `navigation-config`: 导航主题色从硬编码 Tailwind 色阶迁移到 CSS 变量体系，需支持暗色模式

## Impact

- **CSS 变量层**: `main.css` 新增 6 个导航主题色变量（light/dark 各 3 组），并在 `@theme inline` 中注册
- **组件层**: 约 20 个组件文件需替换硬编码色值，涉及 Layout、Sidebar、BottomNav、ChatPage、ChatPanel、ChatBubble、Sender、SettingPage、ModelPage、Skeleton 等
- **配置层**: `navigation.tsx` 的 theme 配置需重写
- **Hooks 层**: 新增 `useTheme` Hook 管理主题状态
- **依赖层**: 不引入新的外部依赖
- **入口层**: `MainApp.tsx` 需在组件树中初始化主题
