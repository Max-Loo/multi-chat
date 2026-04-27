## Context

`src/pages/Setting/components` 包含两个源码文件：

- **SettingHeader.tsx**（42 行）：移动端设置页头部，包含一个菜单按钮，点击触发 `dispatch(toggleDrawer())`。被父组件的 `{isMobile && (...)}` 条件包裹，现有 SettingPage 测试始终 mock 为桌面端，导致该组件从未挂载，分支覆盖率 0%。

- **SettingSidebar.tsx**（112 行）：设置页侧边栏导航，包含按钮列表和 `onClickSettingBtn` 点击回调。现有测试仅验证了渲染和 aria 属性，缺少交互行为测试。分支覆盖率 44.44%。

## Goals / Non-Goals

**Goals:**
- SettingHeader：新建独立测试文件，覆盖移动端渲染和 openDrawer 交互，将分支覆盖率从 0% 提升到 80%+
- SettingSidebar：在现有测试中补充交互测试（点击导航、防重复点击、移动端样式），将分支覆盖率从 44.44% 提升到 65%+
- 整体模块分支覆盖率从 32.25% 提升到 70%+

**Non-Goals:**
- 不修改组件源码
- 不覆盖 `import.meta.env.DEV` 构建时常量的 else 分支
- 不覆盖 Istanbul 伪分支（数组越界、模板字符串插值、JSX 边界）
- 不覆盖 `!container` null 守卫（React 测试中 ref 始终非 null）

## Decisions

**D1: SettingHeader 新建独立测试文件，SettingSidebar 扩展现有测试**

SettingHeader 完全无测试，需要独立文件。SettingSidebar 已在 SettingPage 测试中间接渲染，在其 describe 块中追加交互测试即可，避免重复搭建渲染环境。

**D2: 交互测试 mock 策略**

- SettingHeader：mock `useResponsive` 返回 `isMobile: true`，mock `useAppDispatch` 验证 `toggleDrawer()` action
- SettingSidebar：mock `useNavigate` 验证导航调用，通过 `window.history.pushState` 或 `vi.fn()` 模拟 pathname 来测试防重复点击逻辑

**D3: 不追求 100% 覆盖率**

排除不值得覆盖的分支（构建时常量、伪分支、防御性守卫），聚焦真实业务逻辑分支。

## Risks / Trade-offs

- **SettingSidebar 交互测试耦合 SettingPage 渲染**：如果 SettingPage 结构变更可能导致测试需要同步调整，但这是可接受的维护成本
- **假阳性分支残留**：`t()` 翻译函数和 JSX 边界产生的伪分支（~10 个）无法消除，但通过选择性测试策略可以确保真实分支全部覆盖
