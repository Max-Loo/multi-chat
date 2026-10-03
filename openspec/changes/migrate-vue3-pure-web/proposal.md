# Proposal

## Why

项目当前同时背负两套运行形态（Tauri 桌面端 + Web 端）和 React 技术栈。用户决定将项目收敛为**纯 Web 应用**并切换到 **Vue 3（组合式 API）**：一方面彻底移除桌面壳及其平台分支带来的维护成本（`isTauri()` 分支、双端测试矩阵、Rust 工具链），另一方面统一到 Vue 3 组合式 API 的心智模型。当前代码已具备良好的拆分基础（`src/utils/tauriCompat/` 是唯一的 Tauri 直接消费层、Web 回退实现已就位、Rust 侧零自定义命令），是执行这次迁移的合适时机。

## What Changes

**阶段一：移除 Tauri（React 保持不变）**

- **BREAKING** 删除 `src-tauri/` 目录（Rust 后端、`tauri.conf.json`、Cargo 工程与图标资源）
- **BREAKING** 移除全部 Tauri 依赖：`@tauri-apps/cli`、`@tauri-apps/plugin-http`、`@tauri-apps/plugin-os`、`@tauri-apps/plugin-shell`、`@tauri-apps/plugin-store`、`tauri-plugin-keyring-api`
- 将 `src/utils/tauriCompat/` 中的 Tauri 原生实现分支移除，Web 实现成为唯一实现；`isTauri()` 恒返回 `false`（API 保留以减少业务改动面，后续清理阶段再评估删除）
- 删除 Web 端无意义的模块：Shell 兼容层（`Command`）、Keyring 桌面迁移逻辑中仅服务桌面端的分支
- 构建脚本切换：`dev` → `vite`、`build` → `tsc && vite build`，删除 `tauri dev`/`tauri build`/`web:*` 双轨脚本，统一为一套脚本；GH Pages 部署流程保持不变

**阶段二：React 19 → Vue 3（组合式 API）**

- **BREAKING** UI 层整体重写：189 个 `.tsx` 组件文件迁移为 Vue SFC（`src/components/`、`src/pages/`、`MainApp.tsx`、根入口）
- **BREAKING** 状态管理从 Redux Toolkit（7 个 slice + 3 个 middleware + selectors）迁移到 Pinia（setup store 风格），middleware 语义以 Pinia 插件/订阅保持
- 路由从 `react-router-dom` 迁移到 `vue-router`（保留懒加载与现有路由结构）
- UI 组件从 Radix UI/shadcn 迁移到 shadcn-vue（reka-ui），保持视觉与交互对等
- 配套库映射：`lucide-react` → `lucide-vue-next`、`sonner` → `vue-sonner`、`next-themes` → 主题组合函数、`@tanstack/react-form|react-table` → `@tanstack/vue-form|vue-table`、`react-resizable-panels` → reka-ui Splitter、`virtua` → `@virtua/vue`、`react-masonry-css` → CSS columns 等价方案
- 42 个自定义 React hooks 迁移为 Vue composables（`@vueuse/core` 优先承接通用能力）
- i18n 保留 i18next 核心（懒加载、缓存、完整性检查等既有服务层投资不动），`react-i18next` 绑定层替换为基于 Vue 响应式的薄组合函数
- 移除 React 专属机制：React Compiler、`babel-plugin-react-compiler`、`react-redux`、Suspense 懒加载改用 `defineAsyncComponent`
- 测试栈迁移：`@testing-library/react` → `@testing-library/vue`，vitest/happy-dom/msw/stryker 框架保留

**行为对等原则**：迁移不改变任何用户可感知行为（聊天、模型管理、设置、加密存储、i18n、主题、响应式布局均保持现有规格所述行为）。

**明确不做（非目标）**：
- 桌面端历史数据（Tauri keyring 密钥、store JSON 文件）不提供迁移通道；Web 端数据延续现有 IndexedDB/localStorage 体系
- 不引入服务端后端（BFF）；继续纯静态部署
- 不做 React/Vue 共存的渐进式迁移（两套渲染根与路由不兼容，共存成本高于收益）；采用分支上的整层重写，按能力域分批合入

## Capabilities

### New Capabilities

- `web-only-runtime`: 纯 Web 运行时——平台层（存储/密钥环/HTTP/语言检测）仅保留 Web 实现，`isTauri` 恒为 false，构建脚本与部署为纯 Vite/静态站点
- `vue3-app-shell`: Vue 3 应用外壳——入口挂载、vue-router 路由与懒加载、主题应用、根布局
- `pinia-state-management`: Pinia 状态层——slice → store 映射、middleware 语义、selectors、与持久化层的衔接
- `vue-ui-components`: Vue UI 组件体系——shadcn-vue 组件库、图标/Toast/表单/表格/虚拟滚动/分栏/瀑布流的 Vue 等价实现，行为对等
- `i18n-vue-binding`: i18next 的 Vue 响应式绑定——语言切换的响应式传播、懒加载语言包与既有 i18n 服务层衔接

### Modified Capabilities

- `tauri-plugin-web-compat`: 移除「Tauri 环境使用原生实现」全部需求；环境检测语义变更为恒定 Web 环境；Shell 兼容层（Null Object）整体删除
- `web-store-compat`: 「在 Tauri 和 Web 环境中均可用」变更为仅 Web 环境可用；「从 Tauri 端迁移数据到 Web 端」需求删除；IndexedDB 行为需求不变
- `web-keyring-compat`: 「在 Tauri 和 Web 环境中均可用」变更为仅 Web 环境可用；IndexedDB + AES-256-GCM 加密存储行为需求不变

## Impact

- **代码**：`src-tauri/`（整体删除）；`src/utils/tauriCompat/`（Tauri 分支删除）；`src/components/`、`src/pages/`、`src/hooks/`、`src/store/slices|middleware|selectors`（重写/迁移）；`src/services/`、`src/utils/`（除 tauriCompat 外）、`src/types/`、`src/config/`（基本不动）；`src/__test__/`（React 相关测试重写）
- **依赖**：移除 `@tauri-apps/*`、`tauri-plugin-keyring-api` 及全部 React 生态包；新增 `vue`、`pinia`、`vue-router`、`reka-ui`/shadcn-vue 及配套 Vue 生态包
- **构建/工具链**：移除 Rust 工具链依赖与 `babel-plugin-react-compiler`；Vite 插件从 `@vitejs/plugin-react` 切换为 Vue 插件；脚本统一
- **测试**：组件测试全部重写为 `@testing-library/vue`；纯逻辑测试（services/utils/store 逻辑）保持；stryker 变异测试配置需随测试栈更新
- **文档**：`AGENTS.md`、`README.md`/`README.zh-CN.md`、`docs/design/` 中 React/Tauri 相关描述需同步更新
- **部署**：GH Pages 流程不变；桌面分发渠道（Tauri 安装包）终止
- **风险**：约 400 个源文件受影响，是项目史上最大变更；通过阶段拆分（先 Tauri 后 Vue）、行为对等验收与全量测试回归控制风险
