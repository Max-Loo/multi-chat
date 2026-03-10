# 响应式布局系统提案

## Why

当前应用在窗口尺寸变化时缺乏自适应能力，导致：
- 小窗口（平板/移动端）下主内容侧边栏占用过多空间，主内容区域被严重压缩
- 移动端无法有效使用聊天列表主内容侧边栏
- 不同屏幕尺寸下用户体验差异巨大

现在实现响应式布局系统的时机已经成熟，因为：
- 用户在探索阶段已明确了具体需求（四级响应式策略）
- 技术栈（Tailwind CSS + React）支持完善的响应式方案
- 现有架构清晰，改造难度可控

## What Changes

### 新增功能
- **四级响应式布局系统**（方案 A：统一使用侧边导航栏）：
  - Desktop (≥1280px): 侧边导航栏显示 + 侧边栏显示（完整宽度 224px）+ 主内容（无底部 padding）
  - Compressed (1024px-1279px): 侧边导航栏显示 + 侧边栏显示（压缩宽度 192px）+ 主内容（无底部 padding）
  - Compact (768px-1023px): 侧边导航栏显示 + 侧边栏显示（压缩宽度 192px：缩小宽度、字体、图标）+ 主内容（无底部 padding）
  - Mobile (<768px): 底部导航栏显示 + 侧边栏在抽屉中 + 主内容（pb-16）

**关键设计原则**：
- **侧边导航栏**（全局导航）：在所有非 Mobile 模式下显示（≥768px）
- **底部导航栏**：仅在 Mobile 模式下显示（<768px）
- **打开抽屉按钮**：由各页面自行实现（Chat、Settings、Model 等页面在各自的内容区域添加）
- **主内容侧边栏**（如聊天列表）：在 Desktop、Compact、Compressed 模式显示，Mobile 模式集成在抽屉中

 - **响应式状态管理**：
   - 新增 `useResponsive` Hook 直接获取响应式状态
   - 新增 `useMediaQuery` Hook 实现媒体查询（带 150ms 防抖）
   - Redux store 扩展 `isDrawerOpen` 状态

- **主内容侧边栏四态设计**：
   - Desktop: 完整宽度（224px）+ 正常字体图标
   - Compact: 压缩宽度（192px：缩小宽度、字体、图标）
   - Compressed: 压缩宽度（192px，与 Compact 相同）
   - Mobile: 集成在抽屉中（容器宽度 80% max-w-400px，内部 ChatSidebar 224px）

- **ChatButton 三态设计**：
  - Desktop: 正常字体和图标，显示「更多」按钮
  - Compact: 缩小字体和图标，显示缩小版「更多」按钮
  - Compressed: 与 Compact 相同
  - Mobile: 在抽屉中正常显示，点击「更多」按钮弹出选项（无长按事件）

 - **底部导航栏**：
   - 在 Mobile 模式下显示
   - 固定在底部（~60px 高度）
   - 包含 Chat/Model/Setting 三个导航项
   - 替代左侧全局导航栏

  - **移动端特有组件**：
       - `MobileDrawer`: 通用抽屉容器（从左滑出，容器宽度由内容决定）
         - 宽度策略：`w-fit`（紧贴内容）+ 响应式最大宽度（`max-w-[85vw] sm:max-w-md`）
         - 移动端（<640px）：最大宽度为视窗宽度的 85%
         - 小屏幕及以上（≥640px）：最大宽度为 md（448px）
         - 由各页面包装各自的主内容侧边栏内容
         - Chat 页面：包装 ChatSidebar（224px）
         - Settings 页面：包装设置侧边栏（256px）
         - Model 页面：包装模型表单主内容侧边栏
       - `BottomNav`: 固定底部导航栏（仅 Mobile 模式）
       - **打开抽屉按钮**：由各页面自行实现
        - Chat 页面：在 `ChatPanelHeader` 左侧添加（已配置模型的聊天）
        - ChatContent 页面：在 `ModelSelect` 操作栏左侧添加（未配置模型的聊天）
        - Settings 页面：在 `SettingHeader` 左侧添加
        - Model 创建页面：在 `ModelHeader` 左侧添加

 - **设置页面响应式设计**：
   - **侧边栏无折叠功能**：桌面端侧边栏始终固定显示，无需折叠/展开动画
   - **按钮压缩机制**：设置侧边栏按钮根据屏幕尺寸自动压缩（类似 ChatButton）
     - Desktop (≥1280px): 正常按钮高度（h-11）+ 基础文字大小（text-base）
     - Compact/Compressed (768px-1279px): 压缩按钮高度（h-9）+ 小号文字（text-sm）
     - Mobile (<768px): 在抽屉中正常显示
   - **布局模式**：
     - Mobile: 侧边栏隐藏，使用 MobileDrawer 包裹，通过菜单按钮打开
     - 其他模式 (≥768px): 侧边栏固定显示（w-64，256px），无需折叠

 - **模型创建页面响应式设计**：
   - **侧边栏无折叠功能**：桌面端侧边栏始终固定显示，无需折叠/展开动画
   - **按钮压缩机制**：模型侧边栏按钮根据屏幕尺寸自动压缩
     - Desktop (≥1280px): 正常按钮高度（py-5，40px）+ 正常 Avatar（h-8 w-8，32px）+ 基础文字大小（text-base，16px）
     - Compact/Compressed (768px-1279px): 压缩按钮高度（py-4，32px）+ 压缩 Avatar（h-7 w-7，28px）+ 小号文字（text-sm，14px）
     - Mobile (<768px): 在抽屉中正常显示（与 Desktop 相同）
   - **布局模式**：
     - Mobile: 侧边栏隐藏，使用 MobileDrawer 包裹，通过菜单按钮打开
     - 其他模式 (≥768px): 侧边栏固定显示（w-60，240px），无需折叠
   - **按钮元素压缩**：
     - 按钮 padding（py-5 → py-4）
     - Avatar 大小（h-8 w-8 → h-7 w-7）
     - 文字大小（text-base → text-sm）
     - 容器 padding（p-2 → p-1）

### 布局策略
- **主内容优先**：窗口压缩时，主内容先被压缩，侧边栏后压缩
- **渐进式降级**：桌面 → 压缩 → 抽屉，平滑过渡
- **完全响应式**：布局模式由窗口宽度自动决定，无需手动切换

### 技术优化
- 新增 Tailwind 自定义断点（768px, 1280px）
- 窗口 resize 防抖优化（150ms）
- CSS 过渡动画（300ms）避免布局跳动
- 可访问性支持（键盘导航、ARIA 标签、焦点管理）

## Capabilities

### New Capabilities

- `responsive-layout`: 响应式布局核心能力
  - 提供响应式状态管理（Context + hooks）
  - 实现窗口尺寸检测和断点计算
  - 支持四级布局模式（mobile/compact/compressed/desktop）
  - 防抖优化和性能保障

- `adaptive-sidebar`: 自适应主内容侧边栏
   - 根据窗口宽度自动调整布局和宽度
   - Desktop: 224px 宽度，正常字体图标，垂直列表布局
    - Compact: 192px 宽度，缩小字体图标，垂直列表布局
    - Compressed: 192px 宽度，缩小字体图标，垂直列表布局
   - Mobile: 集成到抽屉中，正常显示（224px 宽度）

  - `mobile-drawer`: 通用移动端抽屉容器
     - Sheet 组件实现，从左侧滑出
     - 容器宽度由内容决定（`w-fit`），响应式最大宽度（移动端 85vw，≥640px 时 max-w-md）
     - 接收 children 作为内容（各页面的侧边栏组件）
     - 半透明遮罩层，点击关闭
     - ESC 键关闭，焦点 trap
     - 阻止背景滚动
     - **复用场景**：Chat/Settings/Model 等页面的移动端侧边栏

 - `bottom-navigation`: 底部导航栏
    - 仅在 Mobile 模式下显示（<768px）
    - 固定在底部（~60px 高度）
    - 包含 Chat/Model/Setting 三个导航项
    - 替代左侧全局导航栏（Sidebar）

  - `responsive-sidebar`: 响应式主内容侧边栏
     - Desktop: 完整宽度（224px）+ 正常字体图标
     - Compact: 压缩宽度（192px：缩小宽度、字体、图标）
     - Compressed: 压缩宽度（192px，与 Compact 相同）
     - Mobile: 在抽屉中正常显示（容器宽度由内容决定，内部 ChatSidebar 224px）
    - 使用 CSS 过渡平滑切换

 - `setting-responsive-layout`: 设置页面响应式布局
    - Desktop/Compact/Compressed (≥768px): 侧边栏固定显示（w-64，256px），无折叠功能
    - Mobile (<768px): 侧边栏在抽屉中，通过菜单按钮打开
    - 按钮根据屏幕尺寸压缩（参考 ChatButton 的 isDesktop 判断）

 - `model-creation-responsive-layout`: 模型创建页面响应式布局
    - Desktop/Compact/Compressed (≥768px): 侧边栏固定显示（w-60，240px），无折叠功能
    - Mobile (<768px): 侧边栏在抽屉中，通过菜单按钮打开
    - 按钮元素根据屏幕尺寸压缩（按钮 padding、Avatar 大小、文字大小）

### Modified Capabilities

- `chat-page-layout`: 聊天页面布局
  - 原有布局仅在 Desktop 模式下工作
  - 现在需要支持四种响应式模式
  - 主内容侧边栏从固定宽度改为响应式宽度
  - 主内容区域需要适配底部导航栏（Mobile 模式）

## Impact

### 新增文件

**Core Layer**
- `src/hooks/useMediaQuery.ts` - 媒体查询 Hook（带 150ms 防抖）
- `src/hooks/useResponsive.ts` - 响应式 Hook（封装层）

**Components**
- `src/components/MobileDrawer/index.tsx` - 通用移动端抽屉容器组件（Chat/Settings/Model 等页面复用）
- `src/components/BottomNav/index.tsx` - 底部导航栏

### 修改文件

**Configuration**
- `tailwind.config.js` - 添加自定义断点（如需要）

**Existing Components**
- `src/components/Layout/index.tsx` - 集成响应式逻辑，条件渲染不同布局模式的组件
  - 注意：MobileDrawer 是通用容器组件，由各个页面（Chat/Settings/Model）根据需要自行渲染
  - Layout 只负责全局布局组件（侧边导航栏/底部导航栏）
- `src/components/Sidebar/index.tsx` - 侧边导航栏（全局导航），根据 `layoutMode` 条件渲染
- `src/pages/Chat/index.tsx` - 传递 `layoutMode` 给 `ChatSidebar`，在 Mobile 模式下使用 MobileDrawer 包装 ChatSidebar
- `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelHeader.tsx` - 在移动端模式下添加打开抽屉按钮（左侧）
- `src/pages/Setting/index.tsx` - 在 Mobile 模式下使用 MobileDrawer 包装设置侧边栏，无折叠功能
- `src/pages/Setting/components/SettingSidebar.tsx` - 实现按钮压缩机制（根据 isDesktop 调整按钮高度和文字大小）
- `src/pages/Setting/components/SettingHeader.tsx` - 新建 Header 组件，仅在移动端显示菜单按钮
- `src/pages/Model/CreateModel/index.tsx` - 在 Mobile 模式下使用 MobileDrawer 包装模型选择侧边栏，无折叠功能
- `src/pages/Model/CreateModel/components/ModelSidebar.tsx` - 实现按钮元素压缩机制（按钮 padding、Avatar 大小、文字大小）
- `src/pages/Model/CreateModel/components/ModelHeader.tsx` - 新建 Header 组件，仅在移动端显示菜单按钮
- `src/pages/Model/index.tsx` - 在 Mobile 模式下使用 MobileDrawer 包装模型表单主内容侧边栏
- `src/pages/Model/components/ModelSelect.tsx` - 在移动端模式下添加打开抽屉按钮（底部栏左侧）
- `src/pages/Chat/components/ChatSidebar/index.tsx` - 扩展为响应式布局（直接修改，不新建容器组件）
- `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx` - 支持四种布局模式
- `src/pages/Chat/components/ChatSidebar/components/ToolsBar.tsx` - 压缩模式优化

**State Management**
- `src/store/slices/chatPageSlices.ts` - 添加 `isDrawerOpen` 状态和 `toggleDrawer` action
- `src/store/slices/settingPageSlices.ts` - 新建设置页面状态管理（添加 `isDrawerOpen` 状态和 `toggleDrawer` action）
- `src/store/slices/modelPageSlices.ts` - 新建模型页面状态管理（添加 `isDrawerOpen` 状态和 `toggleDrawer` action）

**Application Root**
- `src/main.tsx` - 无需修改（直接使用 Hook，无需 Provider）

### 依赖变化

**新增 UI 组件库依赖**
- ✅ `src/components/ui/sheet.tsx` 已添加（基于 `@radix-ui/react-dialog` 的 shadcn/ui Sheet 组件）

**现有依赖**
- 项目已安装 `@radix-ui/react-dialog`（Sheet 组件的底层依赖）
- 无需新增其他依赖

### 系统影响

- **性能**: 窗口 resize 时触发重新计算，通过防抖（150ms）优化
- **可访问性**: 新增键盘导航（ESC 关闭抽屉）、ARIA 标签、焦点管理
- **测试**: 需要为每个新增组件编写单元测试
- **国际化**: 底部导航栏和顶部栏需要支持多语言标签
- **向后兼容**: Desktop 模式下保持现有 UI 不变，无破坏性变更
- **Mobile 交互**: Mobile 模式下侧边栏在抽屉中，点击汉堡菜单打开，点击「更多」按钮弹出选项（无长按事件）
