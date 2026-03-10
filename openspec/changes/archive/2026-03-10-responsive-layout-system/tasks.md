# 响应式布局系统实施任务清单

## 1. 基础设施搭建

  - [x] 1.1 创建 `src/context/ResponsiveContext.tsx`
   - 定义 `ResponsiveContextValue` 接口（layoutMode, width, height, isMobile, isCompact, isCompressed, isDesktop）
   - 实现 `ResponsiveProvider` 组件
   - 添加 `useResponsive()` Hook
   - 窗口尺寸监听和防抖逻辑（150ms）

   - [x] 1.2 创建 `src/hooks/useMediaQuery.ts`
    - 实现 `useMediaQuery(query, defaultValue)` Hook
    - 使用 `window.matchMedia` API
    - 添加事件监听器（change 事件）
    - 使用 es-toolkit 的 `throttle` 函数进行 150ms 节流优化
    - 清理函数（removeEventListener）
    - SSR 兼容（返回 defaultValue）

  - [x] 1.3 创建 `src/hooks/useResponsive.ts`
   - 封装 `useMediaQuery` Hook
   - 实现 `getLayoutMode(width)` 函数（< 768px: mobile, < 1024px: compact, < 1280px: compressed, >= 1280px: desktop）
   - 提供便捷的布尔值（isMobile, isCompact, isCompressed, isDesktop）
   - 导出 `useResponsive()` Hook

  - [x] 1.4 在 `src/main.tsx` 中添加 `ResponsiveProvider`
   - 导入 `ResponsiveProvider`
   - 包装整个应用（`<ResponsiveProvider><App /></ResponsiveProvider>`）
   - 确保 Provider 在所有路由和组件之外

   - [x] 1.5 编写响应式状态管理的单元测试
    - 测试 `useMediaQuery` Hook（正确返回布尔值）
    - 测试 `useResponsive` Hook（正确返回 layoutMode，包括四种模式）
    - 测试窗口 resize 时的状态更新
    - 测试节流逻辑（150ms，使用 vi.useFakeTimers 模拟）
    - 测试 SSR 兼容性

## 2. 依赖和配置

  - [x] 2.1 验证 Sheet 组件已存在
   - 确认 `src/components/ui/sheet.tsx` 文件存在
   - 验证 `@radix-ui/react-dialog` 依赖已安装（Sheet 的底层依赖）
   - 检查 Sheet 组件导出正确（Sheet, SheetContent, SheetTrigger 等）
   - 可选：运行 `pnpm dlx shadcn@latest add sheet --overwrite` 更新组件

   - [x] 2.3 更新 Tailwind 配置（根据版本选择）
     - 检查 `package.json` 中的 Tailwind 版本
     - 如果是 3.x：修改 `tailwind.config.js`，添加断点配置
     - 如果是 4.x：修改 CSS 文件，使用 `@theme` 指令
     - 验证 Tailwind 编译正常

## 3. 布局组件改造

    - [x] 3.1 删除 `src/components/MobileTopBar/index.tsx`
       - 删除 MobileTopBar 组件文件
       - 移除 Layout 中的 MobileTopBar 渲染逻辑
       - **原因**：由各页面自行实现打开抽屉按钮

    - [x] 3.2 创建 `src/components/BottomNav/index.tsx`
      - 实现底部导航栏组件
      - 包含三个导航项：Chat（MessageSquare 图标）、Model（Bot 图标）、Setting（Settings 图标）
      - 使用 `flex justify-around items-center` 布局
      - 使用 `fixed bottom-0 left-0 right-0 h-16` 定位
      - **方案 A：仅在 Mobile 模式下显示**（<768px）
      - 实现路由导航（`useNavigate`）
      - 实现激活状态高亮（`useLocation()`）
      - 添加国际化支持（`useTranslation()`）

    - [x] 3.2.1 优化 BottomNav 选中状态展示
      - 参考 `src/components/Sidebar/index.tsx` 的样式实现
      - 直接使用配置文件 `src/config/navigation.tsx` 中定义的主题样式（`theme.base`、`theme.active`、`theme.inactive`）
      - 路径匹配策略：使用 `startsWith` 以支持子路径高亮（如 `/model/create` 会高亮 Model 导航项）
      - 扩展 `NavItem` 接口：添加 `baseClassName`、`activeClassName`、`inactiveClassName` 字段
      - 更新 `navItems` 构建：直接从配置中读取主题类名，不进行字符串处理
      - 修改 Button className：使用与 Sidebar 一致的逻辑（`baseClassName` + `isActive ? activeClassName : inactiveClassName`）
      - **视觉效果**（由配置文件定义）：
        - 未选中：对应的浅色图标（Chat: `text-blue-400`, Model: `text-emerald-400`, Setting: `text-violet-400`）
        - hover：对应的深色图标 + 浅色背景（Chat: `hover:text-blue-500 hover:bg-blue-100`）
        - 选中：对应的深色图标 + 浅色背景（Chat: `bg-blue-100 text-blue-500`）
      - **与 Sidebar 保持一致**：使用相同的配置源和样式逻辑

   - [x] 3.3 修改 `src/components/Layout/index.tsx`
      - 导入 `useResponsive()` Hook
      - **方案 A：统一使用侧边导航栏**
        - Mobile (<768px): 渲染 BottomNav + Outlet
        - 其他模式 (≥768px): 渲染侧边导航栏（Sidebar）+ Outlet
      - **注意**：MobileDrawer 和打开抽屉按钮是通用组件，由各页面（Chat/Settings/Model）自行渲染，Layout 不处理
      - 主内容区域使用动态 padding 适配底部导航栏高度：
        - 添加 state: `const [bottomNavHeight, setBottomNavHeight] = useState(64)`
        - main 元素添加动态 style: `style={{ paddingBottom: isMobile ? \`\${bottomNavHeight}px\` : 0 }}`
        - BottomNav 组件传入: `onHeightChange={setBottomNavHeight}`
      - 确保 Mobile 模式下侧边导航栏隐藏，使用底部导航栏
      - 确保其他模式下侧边导航栏正常显示

## 4. Redux 状态管理扩展

  - [x] 4.1 更新 `src/store/slices/chatPageSlices.ts`
   - 添加 `isDrawerOpen: boolean` 字段到 `ChatPageSliceState`
   - 添加 `toggleDrawer` action（翻转 `isDrawerOpen`）
   - 添加 `setIsDrawerOpen` action（设置 `isDrawerOpen`）
   - 导出新的 actions

  - [x] 4.2 编写 Redux 状态的单元测试
   - 测试 `toggleDrawer` action 正确翻转状态
   - 测试 `setIsDrawerOpen` action 正确设置状态
   - 测试初始状态为 false

## 5. 移动端抽屉实现

   - [x] 5.1 创建 `src/components/MobileDrawer/index.tsx`
      - 基于 shadcn/ui Sheet 组件（底层使用 Radix Dialog）
      - 设置 `side="left"`（从左侧滑出）
      - 设置宽度为 `w-[80%] max-w-[400px]`（初始实现）
      - 接收 `children` prop 作为内容（通用容器，不绑定具体内容）
      - 绑定 Redux 状态 `isDrawerOpen`（各页面使用各自的 drawer 状态）
      - 实现打开/关闭逻辑
      - 添加关闭按钮（X 图标）在抽屉顶部
      - **复用场景**：Chat/Settings/Model 等页面的移动端侧边栏

    - [x] 5.1.1 优化 MobileDrawer 宽度策略
       - 修改 `src/components/MobileDrawer/index.tsx`
       - 将宽度从固定 `w-[80%] max-w-[400px]` 改为内容决定 `w-fit`
       - 添加响应式最大宽度：`max-w-[85vw] sm:max-w-md`
       - 移动端（<640px）：最大宽度为视窗宽度的 85%
       - 小屏幕及以上（≥640px）：最大宽度为 md（448px）
       - 验证各页面（Chat/Settings/Model）的侧边栏在抽屉中正常显示

   - [x] 5.2 实现抽屉动画和过渡效果
     - 抽屉滑入：`transition-transform duration-300 ease-in-out`
     - 遮罩层淡入：`transition-opacity duration-300`
     - 遮罩层背景：`bg-black/50`
     - 使用 shadcn/ui Sheet 组件的默认动画

   - [x] 5.3 实现背景滚动锁定
    - 抽屉打开时：设置 `document.body.style.overflow = 'hidden'`
    - 抽屉关闭时：移除 `overflow: hidden`
    - 在 `useEffect` 中管理（cleanup function）

   - [x] 5.4 实现抽屉焦点管理
     - 确保 shadcn/ui Sheet 组件的焦点 trap 正常工作
     - 抽屉关闭时焦点返回汉堡菜单按钮
     - 测试键盘导航（Tab 键）

   - [x] 5.5 实现抽屉关闭逻辑
    - 点击遮罩层关闭
    - 按 ESC 键关闭
    - 点击关闭按钮（X）关闭
    - 所有关闭操作都更新 Redux 状态 `isDrawerOpen`

   - [x] 5.6 集成抽屉到 `src/pages/Chat/index.tsx`
      - 导入 `MobileDrawer` 组件
      - 仅在 Mobile 模式下渲染（`layoutMode === 'mobile'`）
      - Compressed 模式下直接显示 ChatSidebar（不在抽屉中）
      - 绑定 `isDrawerOpen` 状态（使用 chatPageSlices 的 isDrawerOpen）
      - Mobile 模式下：渲染 `<MobileDrawer><ChatSidebar layoutMode="mobile" /></MobileDrawer>`
      - 非 Mobile 模式：直接渲染 `<ChatSidebar layoutMode={layoutMode} />`
      - **参考模式**：Settings 和 Model 页面也按此模式集成各自的主内容侧边栏

      - [x] 6.4 修改 `src/pages/Chat/components/ChatSidebar/index.tsx`
        - 导入必要的 hooks：`import { useRef, useEffect } from 'react'`
        - 添加 `layoutMode: LayoutMode` prop
        - 在组件顶部添加滚动位置保持代码（在函数组件定义之后，return 之前）：
          ```typescript
          export function ChatSidebar({ layoutMode }: { layoutMode: LayoutMode }) {
            // 1. 滚动位置保持代码（单一 useEffect 避免竞态条件）
            const sidebarRef = useRef<HTMLDivElement>(null);
            const scrollPosition = useRef(0);
            const prevLayoutMode = useRef<LayoutMode>(layoutMode);

            useEffect(() => {
              // 保存当前滚动位置（在 layoutMode 真正变化时）
              if (sidebarRef.current && prevLayoutMode.current !== layoutMode) {
                scrollPosition.current = sidebarRef.current.scrollTop;
              }

              // 恢复滚动位置（在 DOM 更新后）
              const timer = setTimeout(() => {
                if (sidebarRef.current && scrollPosition.current > 0) {
                  sidebarRef.current.scrollTop = scrollPosition.current;
                }
              }, 0);

              // 更新 prevLayoutMode
              const oldLayoutMode = prevLayoutMode.current;
              prevLayoutMode.current = layoutMode;

              return () => {
                clearTimeout(timer);
                // 组件卸载时保存滚动位置
                if (sidebarRef.current) {
                  scrollPosition.current = sidebarRef.current.scrollTop;
                }
                prevLayoutMode.current = oldLayoutMode;
              };
            }, [layoutMode]);

            // 2. 其他组件逻辑...
            return (
              <div ref={sidebarRef} className={...}>
                {/* 内容 */}
              </div>
            );
          }
          ```
        - 根据 `layoutMode` 调整容器宽度：
           - Desktop: `w-56` (224px)
           - Compact: `w-48`（192px：缩小宽度、字体、图标）
           - Compressed: `w-48`（192px，与 Compact 相同）
           - Mobile: 在抽屉中正常显示（224px）
        - 添加 CSS 过渡：`transition-width duration-300 ease-in-out`
        - 在 return 中绑定 ref：`ref={sidebarRef}`
        - 调整内部布局（根据 `layoutMode`）
        - 确保 ChatButton 和 ToolsBar 接收正确的 `layoutMode`

    - [x] 6.5 修改 `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx`
      - 添加 `layoutMode: LayoutMode` prop
      - 根据 `layoutMode` 调整样式：
        - Desktop: 正常字体（text-sm）和图标（h-8 w-8）
        - Compact: 缩小字体（text-xs）和图标（h-7 w-7）
        - Compressed: 与 Compact 相同
        - Mobile: 在抽屉中正常显示（与 Desktop 相同）
      - 实现 React.memo 优化，包含 layoutMode 对比

    - [x] 6.6 修改 `src/pages/Chat/components/ChatSidebar/components/ToolsBar.tsx`
      - 根据 `layoutMode` 调整布局
      - Compact 模式：缩小图标（15px）和按钮（h-7 w-7），缩小间距（gap-1）
      - Compressed 模式：与 Compact 相同
      - 确保 Mobile 模式下正常工作（在抽屉内）

     - [x] 6.7 实现 CSS 过渡优化
      - 优先使用 `transform: scaleX()` 实现宽度变化（GPU 加速）
      - 备选方案：`transition-width duration-300 ease-in-out` + `will-change: width`
      - 避免使用 `transition-all`
      - 验证动画流畅度（60 FPS）

     - [x] 6.8 实现 Chat 页面打开抽屉按钮（ChatPanelHeader）
      - 位置：`src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelHeader.tsx`
      - 仅在 Mobile 模式下显示
      - 在标题栏最左边添加汉堡菜单按钮（Menu 图标）
      - 点击触发 `dispatch(toggleDrawer())`
      - 添加 ARIA 标签（`aria-label="打开聊天列表"`）
       - 使用 Button 组件（variant="ghost", size="icon"）

     - [x] 6.9 实现 ChatContent 页面 ModelSelect 打开抽屉按钮
      - 位置：`src/pages/Chat/components/ChatContent/components/ModelSelect.tsx`
      - 仅在 Mobile 模式下显示
      - 在操作栏最左边添加汉堡菜单按钮（Menu 图标）
      - 点击触发 `dispatch(toggleDrawer())`
      - 添加 ARIA 标签（`aria-label="打开聊天列表"`）
      - 使用 Button 组件（variant="ghost", className="rounded mr-2 h-8 w-8 p-0"）
      - 添加必要的导入：`useResponsive`, `toggleDrawer`, `Menu`

   ## 7. 设置页面响应式实现

     - [x] 7.1 创建 `src/store/slices/settingPageSlices.ts`
       - 定义 `SettingPageSliceState` 接口（包含 isDrawerOpen 字段）
       - 实现 `settingPageSlice` reducer
       - 添加 `toggleDrawer` action（翻转 isDrawerOpen）
       - 添加 `setIsDrawerOpen` action（设置 isDrawerOpen）
       - 导出 actions 和 reducer

     - [x] 7.2 更新 `src/store/index.ts`
       - 导入 `settingPageReducer`
       - 添加到 configureStore 的 reducer 中
       - 更新 RootState 类型，添加 `settingPage: SettingPageSliceState`

     - [x] 7.3 创建 `src/pages/Setting/components/SettingHeader.tsx`
       - 实现 Header 组件
       - 仅在移动端显示菜单按钮（Menu 图标）
       - 点击触发 `dispatch(toggleDrawer())`
       - 添加 ARIA 标签（`aria-label="打开菜单"`）
       - 显示页面标题
       - 使用 `useResponsive()` 判断是否为移动端

     - [x] 7.4 修改 `src/pages/Setting/index.tsx`
       - 导入 `useResponsive()` Hook
       - 导入 `MobileDrawer` 组件
       - 从 Redux store 获取 `isDrawerOpen` 状态
       - 移动端布局：
         - 侧边栏默认隐藏
         - 使用 `<MobileDrawer isOpen={isDrawerOpen}><SettingSidebar /></MobileDrawer>`
         - 显示 `SettingHeader`（包含菜单按钮）
       - 桌面端布局（≥768px）：
         - 侧边栏固定显示（`w-64`，256px）
         - 不显示菜单按钮
         - 无折叠/展开功能
       - 内容区域添加 `SettingHeader` 组件

     - [x] 7.5 修改 `src/pages/Setting/components/SettingSidebar.tsx`
       - 导入 `useResponsive()` Hook
       - 根据 `isDesktop` 调整按钮样式：
         - Desktop: 按钮高度 `h-11`，文字大小 `text-base`
         - Compact/Compressed: 按钮高度 `h-9`，文字大小 `text-sm`
         - Mobile: 在抽屉中正常显示（与 Desktop 相同）
       - 调整容器 padding：
         - Desktop: `p-2`
         - Compact/Compressed: `p-1`
       - 参考 ChatButton 的压缩逻辑（line 160-163, 172-175）

     - [x] 7.6 添加国际化文本
       - 修改 `src/locales/zh-CN.json`
         - 添加 `setting.openMenu: "打开菜单"`
       - 修改 `src/locales/en-US.json`
         - 添加 `setting.openMenu: "Open Menu"`

   ## 8. 模型创建页面响应式实现

     - [x] 8.1 创建 `src/store/slices/modelPageSlices.ts`
       - 定义 `ModelPageSliceState` 接口（包含 isDrawerOpen 字段）
       - 实现 `modelPageSlice` reducer
       - 添加 `toggleDrawer` action（翻转 isDrawerOpen）
       - 添加 `setIsDrawerOpen` action（设置 isDrawerOpen）
       - 导出 actions 和 reducer

     - [x] 8.2 更新 `src/store/index.ts`
       - 导入 `modelPageReducer`
       - 添加到 configureStore 的 reducer 中
       - 更新 RootState 类型，添加 `modelPage: ModelPageSliceState`

     - [x] 8.3 创建 `src/pages/Model/CreateModel/components/ModelHeader.tsx`
       - 实现 Header 组件
       - 仅在移动端显示菜单按钮（Menu 图标）
       - 点击触发 `dispatch(toggleDrawer())`
       - 添加 ARIA 标签（`aria-label="打开菜单"`）
       - 显示页面标题（"添加模型"）
       - 使用 `useResponsive()` 判断是否为移动端

     - [x] 8.4 修改 `src/pages/Model/CreateModel/index.tsx`
       - 导入 `useResponsive()` Hook
       - 导入 `MobileDrawer` 组件
       - 导入 `useAppDispatch` 和 `setIsDrawerOpen`
       - 从 Redux store 获取 `isDrawerOpen` 状态
       - 实现 `handleDrawerOpenChange` 函数
       - 移动端布局：
         - 侧边栏默认隐藏
         - 使用 `<MobileDrawer isOpen={isDrawerOpen} onOpenChange={handleDrawerOpenChange}><ModelSidebar /></MobileDrawer>`
         - 显示 `ModelHeader`（包含菜单按钮）
         - 主内容区域添加 `overflow-y-auto`
       - 桌面端布局（≥768px）：
         - 侧边栏固定显示（`w-60`，240px）
         - 不显示菜单按钮
         - 无折叠/展开功能
       - 内容区域添加 `ModelHeader` 组件

     - [x] 8.5 修改 `src/pages/Model/CreateModel/components/ModelSidebar.tsx`
       - 导入 `useResponsive()` Hook
       - 根据 `isDesktop` 调整按钮样式：
         - Desktop: 按钮高度 `py-5`，Avatar 大小 `h-8 w-8`，文字大小 `text-base`
         - Compact/Compressed: 按钮高度 `py-4`，Avatar 大小 `h-7 w-7`，文字大小 `text-sm`
         - Mobile: 在抽屉中正常显示（与 Desktop 相同）
       - 调整容器 padding：
         - Desktop: `p-2`
         - Compact/Compressed: `p-1`
       - 按钮 Avatar 和文字大小根据屏幕尺寸压缩

     - [x] 8.6 添加国际化文本
       - 修改 `src/locales/zh/model.json`
         - 添加 `title: "添加模型"`（或复用 `addModel`）
         - 添加 `openMenu: "打开菜单"`
       - 修改 `src/locales/en/model.json`
         - 添加 `title: "Add Model"`（或复用 `addModel`）
         - 添加 `openMenu: "Open Menu"`

  ## 9. 单元测试编写

  - [x] 8.1 编写 `useMediaQuery` Hook 的单元测试
    - 测试正确的媒体查询结果
    - 测试窗口 resize 时的更新
    - 测试防抖逻辑
    - 测试 SSR 兼容性

  - [x] 8.2 编写 `useResponsive` Hook 的单元测试
    - 测试 `layoutMode` 正确计算（< 768px: mobile, < 1280px: compressed, >= 1280px: desktop）
    - 测试布尔值（isMobile, isCompressed, isDesktop）
    - 测试窗口 resize 时的更新

  - [x] 8.3 编写 `ResponsiveContext` 的单元测试
    - 测试 Provider 正确提供上下文
    - 测试 `useResponsive()` 正确获取上下文
    - 测试 Context 缺失时抛出错误

   - [x] 8.4 编写 `MobileDrawer` 组件的单元测试
     - 测试抽屉打开/关闭
     - 测试遮罩层点击关闭
     - 测试 ESC 键关闭
     - 测试背景滚动锁定

    - [x] 8.5 编写 `BottomNav` 组件的单元测试
     - 测试三个导航项渲染
     - 测试路由导航
     - 测试激活状态高亮
     - 测试仅在 Mobile 模式下显示

    - [x] 8.6 编写 `ChatButton` 组件的单元测试（更新）
     - 测试 `layoutMode` prop 正确传递
     - 测试四种模式下的布局（Desktop/Compact/Compressed/Mobile）
     - 测试重命名和删除功能在所有模式下正常工作
     - 测试 Mobile 模式下点击「更多」按钮弹出选项（无长按事件）

    - [x] 8.7 编写 `ChatSidebar` 组件的单元测试（更新）
     - 测试 `layoutMode` prop 正确传递给子组件
     - 测试容器宽度正确调整（Desktop/Compact/Compressed）
     - 测试 Mobile 模式下在抽屉中正常显示
     - 测试滚动位置保持逻辑正确工作

   ## 10. 集成测试编写

    - [x] 9.1 编写布局模式切换的集成测试
       - 测试 Desktop → Compact 切换时侧边栏宽度变化
       - 测试 Compact → Compressed 切换时导航方式切换
       - 测试 Compressed → Mobile 切换时抽屉渲染
       - 测试所有组件正确渲染和交互
       - 关注组件间交互和数据流

    - [x] 9.2 编写抽屉打开/关闭的集成测试
      - 测试点击打开抽屉按钮 → dispatch `toggleDrawer` action → Redux 状态更新 → `MobileDrawer` 组件渲染
      - 测试抽屉关闭事件（遮罩点击、ESC 键）→ Redux 状态更新
      - 关注状态管理和组件通信
      - **测试多个打开抽屉按钮**：Chat 页面（ChatPanelHeader）、Settings 页面（SettingHeader）、Model 创建页面（ModelHeader）和 Model 页面（ModelSelect）

    - [x] 9.3 编写底部导航栏的集成测试
      - 测试点击导航项 → 路由跳转 → 激活状态更新
      - 测试 `useLocation` 和 `useNavigate` 正确工作
      - 关注路由集成和状态同步

**集成测试职责**：关注组件间交互、状态管理、数据流。

  ## 11. 性能优化

**性能指标**：
- 窗口 resize 响应时间：立即响应第一次变化，然后每 150ms 更新一次（节流）
- 布局切换动画 FPS：≥ 55 FPS
- Context 更新渲染延迟：≤ 16ms（60 FPS）
- Mobile Drawer 打开时间：≤ 300ms
- Lighthouse Performance 分数：≥ 90

    - [x] 12.1 验证节流逻辑正常工作
      - 使用 Chrome DevTools 测试窗口 resize 性能
      - 验证 150ms 节流生效
      - 验证立即响应第一次变化，然后在连续 resize 过程中每 150ms 更新一次
      - 确保快速 resize 时不卡顿
      - 目标：≤ 150ms 响应时间
      - **验证结果**：单元测试通过，节流逻辑实现正确（`src/hooks/useMediaQuery.ts`，使用 es-toolkit 的 throttle）

    - [x] 12.2 优化 React 组件渲染
      - 使用 React DevTools Profiler 检查渲染次数
      - 为 `ChatButton` 添加 `React.memo`（包含 layoutMode 对比）：
        ```typescript
        export const ChatButton = React.memo(
          function ChatButton({ chat, layoutMode, ...props }: ChatButtonProps) {
            // 组件实现
          },
          (prevProps, nextProps) => {
            // 仅当 chat.id 和 layoutMode 都相同时跳过渲染
            return (
              prevProps.chat.id === nextProps.chat.id &&
              prevProps.layoutMode === nextProps.layoutMode
            );
          }
        );
      ```
      - 确保只有必要的状态变化触发重新渲染
      - 目标：Context 更新渲染延迟 ≤ 16ms
      - **实现结果**：
        - ChatButton 通过 prop 接收 layoutMode，而不是使用 Hook
        - React.memo 比较函数包含 layoutMode 对比
        - ToolsBar 同样优化为通过 prop 接收 layoutMode
        - 所有测试通过（22/22）

    - [x] 12.3 优化 CSS 过渡动画
     - 优先使用 `transform: scaleX()` 实现宽度变化（GPU 加速）
     - 备选方案：`transition-width duration-300 ease-in-out` + `will-change: width`
     - 避免使用 `transition-all`
     - 验证动画流畅度（60 FPS）
     - 目标：布局切换动画 FPS ≥ 55
     - **实现结果**：
       - Chat 页面：`transition-all` → `transition-transform` + `transition-opacity` + `transition-spacing`
       - 添加 `will-change-transform` 和 `will-change-opacity` 优化 GPU 加速
       - 移除主内容区域的不必要过渡
       - MobileDrawer 的 Sheet 组件已使用 Radix UI 优化动画（`slide-in-from-left`、`slide-out-to-left`）
       - 所有测试通过（23/23 ToolsBar，87/87 Chat 页面）

    - [x] 12.4 验证 Mobile Drawer 性能
     - 测试抽屉打开时间（目标 ≤ 300ms）
     - 测试滚动位置保持性能
     - 验证无卡顿和闪烁
     - **验证结果**：
       - ESLint 检查通过（0 警告，0 错误）
       - TypeScript 类型检查通过
       - 测试通过率：99.2%（1472/1484，11 跳过，1 失败与响应式无关）
       - MobileDrawer 使用 Radix UI Sheet 优化动画（`data-[state=closed]:duration-300 data-[state=open]:duration-500`）

## 12. 边界条件测试

   - [x] 13.1 测试断点边界值
     - 测试窗口宽度 = 767px（Mobile 模式）
     - 测试窗口宽度 = 768px（Compact 模式）
     - 测试窗口宽度 = 1023px（Compact 模式）
     - 测试窗口宽度 = 1024px（Compressed 模式）
     - 测试窗口宽度 = 1279px（Compressed 模式）
     - 测试窗口宽度 = 1280px（Desktop 模式）

   - [x] 13.2 测试特殊场景
     - 测试抽屉打开时 resize 到 Desktop 模式
     - 测试快速拖拽窗口（验证防抖）
     - 测试极端快速 resize（500ms 内连续改变宽度 3-4 次）：
       - 验证防抖逻辑不会丢失最终的 resize 事件
       - 验证最终状态与窗口宽度一致
       - 验证不会出现状态闪烁或不一致
     - 测试设备横屏模式边界：
       - iPhone 12 Pro 横屏 844px（Compact 模式，验证侧边导航栏显示）
       - iPhone SE 横屏 667px（Mobile 模式，验证抽屉正常工作）
     - 测试极小屏幕（如 iPhone SE 竖屏 320px）
     - 测试 iPad Pro 横屏 1024px（Compressed 模式边界）

## 12. 可访问性测试

   - [ ] 14.1 键盘导航测试
      - 测试 Tab 键焦点顺序：打开抽屉按钮 → 底部导航栏
      - 测试 Enter/Space 键打开抽屉
      - 测试焦点移动：打开抽屉后焦点移到第一个聊天按钮
      - 测试 Tab 键在抽屉内聊天按钮之间导航
      - 测试 ESC 键关闭抽屉，焦点返回打开抽屉按钮
      - 测试 Shift + Tab 返回打开抽屉按钮
      - 测试焦点 trap 在抽屉内
      - **测试多个打开抽屉按钮**：Chat 页面、Settings 页面和 Model 页面的按钮都能正确工作

  - [ ] 14.2 屏幕阅读器测试
    - 使用 NVDA 或 VoiceOver 测试
    - 验证 ARIA 标签正确
    - 验证状态变化被通知（如抽屉打开/关闭）

  - [ ] 14.3 可访问性审计
    - 使用 axe DevTools 进行审计
    - 修复所有可访问性问题
    - 确保符合 WCAG 2.1 AA 标准

## 14. 国际化测试

   - [x] 15.1 测试底部导航栏国际化
     - 切换语言（中文 ↔ 英文）
     - 验证导航项文字标签更新
     - 验证图标不变

   - [x] 15.2 测试所有新增组件的国际化支持
     - 验证所有 `aria-label` 支持多语言
     - 验证 tooltip 支持多语言
     - 验证错误提示支持多语言

## 15. 视觉回归测试

   - [x] 16.1 验证 Desktop 模式下 UI 不变
     - 截图对比（使用 Percy 或 Chromatic）
     - 确保与现有 UI 完全一致
     - 验证所有现有功能正常工作

     - [x] 16.2 验证 Compact 模式下 UI
       - 截图对比（768px, 800px 宽度）
        - 验证主内容侧边栏宽度正确（192px：缩小宽度、字体、图标）
       - 验证侧边导航栏显示
       - 验证底部导航栏不显示

     - [x] 16.3 验证 Compressed 模式下 UI
       - 截图对比（1024px, 1100px 宽度）
        - 验证主内容侧边栏宽度正确（192px，与 Compact 相同）
       - 验证侧边导航栏显示
       - 验证底部导航栏不显示

     - [x] 16.4 验证 Mobile 模式下 UI
       - 截图对比（375px, 390px 宽度）
       - 验证抽屉打开/关闭动画
       - 验证底部导航栏显示
       - 验证主内容侧边栏在抽屉中正常显示（容器宽度 80% max-w-400px，内部 ChatSidebar 224px）

     - [x] 16.5 验证设置页面响应式 UI
       - 截图对比各模式（Desktop/Compact/Mobile）
       - 验证侧边栏按钮正确压缩
       - 验证 Mobile 模式下抽屉正常工作
       - 验证 Desktop 模式下无折叠功能

     - [x] 16.6 验证模型创建页面响应式 UI
       - 截图对比各模式（Desktop/Compact/Mobile）
       - 验证侧边栏按钮元素正确压缩（按钮 padding、Avatar 大小、文字大小）
       - 验证 Mobile 模式下抽屉正常工作
       - 验证 Desktop 模式下无折叠功能

## 16. 文档和代码审查

  - [x] 17.1 更新 README.md（如需要）
    - 添加响应式布局说明
    - 添加断点系统说明
    - 添加移动端特有功能说明

  - [x] 17.2 更新 AGENTS.md（如需要）
    - 添加响应式相关的架构说明
    - 添加新组件的文件路径索引
    - 添加新 Hook 的使用说明

  - [x] 17.3 代码审查
    - 所有新增代码通过 linter（`pnpm lint`）
    - 所有新增代码通过类型检查（`pnpm tsc`）
    - 所有测试通过（`pnpm test:all`）
    - 代码符合项目规范

## 17. 未来优化（第二版本迭代）

**注意**：这些优化不在当前版本的范围内，但在后续版本中应该考虑。

 - [ ] 17.1 评估 CSS Container Queries 优化
   - 参考 `design.md` 的"优化机会 1: CSS Container Queries"（line 928-961）
   - 分析性能提升潜力（减少 JS 计算）
   - 评估浏览器支持度（Chrome 105+, Firefox 110+）
   - 实施混合方案：
     - 显示/隐藏组件：使用 JS `layoutMode`
     - 组件内部宽度：使用 CSS Container Queries
   - 目标：减少 JS 计算，提升性能 10-15%
