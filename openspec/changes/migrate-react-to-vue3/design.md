## Context

当前前端为 React 19 + Redux Toolkit/react-redux + react-router-dom v7 + Radix UI（shadcn 风格）+ react-i18next + Tailwind v4 + Vite 7 + Vitest（RTL），构建于 Tauri 2.0 之上。视图层约 100 个 `.tsx` 组件、89 个组件级测试。架构上存在清晰的框架分界线：

- **框架无关层（零改动或近零改动）**：`services/`（chat、initialization、modelRemote、toast/toastQueue）、`store/storage/`、`store/keyring/`、`utils/`（含 tauriCompat）、`types/`、`locales/`、`src-tauri/`
- **React 绑定层（全部重写）**：`main.tsx`、`MainApp.tsx`、`components/`、`pages/`、`hooks/`、`router/`、`store/`（slices/middleware/selectors 与 react-redux 绑定）

已确认的四个决策（用户选定）：**Pinia** 状态管理、**shadcn-vue + Reka UI** 组件方案、**保留 i18next + Vue 适配层**、**全量迁移于独立分支**。

## Goals / Non-Goals

**Goals:**

- 终端用户零感知：URL、视觉、交互、数据格式、持久化行为完全对等
- React 依赖树清零，视图层全面采用 Vue 3 生态标准方案
- 框架无关层保持不动，复用其既有测试作为行为基准
- 质量门禁不降级：测试、覆盖率阈值、lint、类型检查全部对等保留

**Non-Goals:**

- 不做 UI 重设计、不新增功能、不调整路由结构
- 不修改 Rust 后端、存储数据格式与加密方案
- 不做 React/Vue 渐进共存（已决策全量切换）
- 不逐条复刻 React Compiler 的自动记忆化——由 Vue 响应式系统天然替代，仅对热点组件（如聊天气泡流）按需用 `v-memo`/`shallowRef` 验证性能

## Decisions

### D1. Vue 3.5 + `<script setup lang="ts">` 全量 SFC

全部组件采用 Composition API + `<script setup>`。备选 Options API 被排除：类型推导差、与 composables 组合冗长。纯逻辑 hooks（`useDebounce`、`useMediaQuery`、`useResponsive`、`useScrollContainer` 等）迁移为 composables 时多数只需去掉 React import 改用 Vue 响应式原语，函数签名尽量保持不变以降低调用方改动。

### D2. 入口与启动流程对等迁移

`main.tsx` 顶层 `await import("@/config/initSteps")` → `main.ts` 保留；React root 状态机（loading → initializing → ready，HTML Spinner 兜底）重写为 `App.vue` 的状态机 + 动态组件。`createMainApp(result)` 工厂模式保留：`MainApp.vue` 通过 `defineComponent`/动态 `<component :is>` 承载初始化结果注入，维持"初始化完成后才动态加载重型依赖"的按需加载策略（chunk-init 分包不变）。

### D3. 路由：vue-router 4 一比一映射

`createBrowserRouter` → `createWebHistory(base)`；`<Navigate>` 重定向 → 路由 `redirect` 字段；`lazy(() => import())` → `() => import()`；`Layout` 嵌套子路由 → 嵌套路由表 + `<RouterView>`；`*` 兜底 → `/:pathMatch(.*)*`；dev-only toast-test 路由用 `import.meta.env.DEV` 条件注入，行为不变；basename 取自 `import.meta.env.BASE_URL` 逻辑原样保留。

### D4. 状态管理：RTK → Pinia（setup store 风格）

7 个 slice（models/chat/chatPage/appConfig/modelProvider/settingPage/modelPage）逐个映射为 setup 风格 store（`defineStore('chat', () => {...})`）。要点：

- **不可变更新 → 直接变更**：RTK 的 Immer 写法迁移为对 `reactive`/`ref` 状态的直接赋值，以现有 slice 单测为行为基准逐条对齐
- **持久化中间件 → `$subscribe`/`watch`**：3 个 RTK listener middleware（saveChatList/saveModels/saveDefaultAppLanguage）改为各 store 内 `watch` 或统一 Pinia 插件订阅，防抖/条件写入语义保持
- **selectors → computed**：`store/selectors/` 迁移为 store 内 `computed` 或独立 `computed` 工厂，供跨组件复用
- **绑定层**：`src/hooks/redux.ts`（useAppDispatch/useAppSelector）废弃，调用方改用 `useChatStore()` 等实例访问
- `triggerSilentRefreshIfNeeded(store)` 等 store 外部触达点改为对应 store 的 action

### D5. UI 组件：shadcn-vue（Reka UI 底座）+ 依赖映射表

`src/components/ui/` 的 30 个组件按 shadcn-vue 官方实现替换，`cn()` 工具与 `class-variance-authority`、`clsx`、`tailwind-merge`（框架无关）保留，Tailwind v4 样式与主题变量不动。其余 React 专属依赖映射：

| 现依赖 | Vue 方案 | 说明 |
| --- | --- | --- |
| @radix-ui/react-*（13 个） | reka-ui | radix-vue 更名后的官方后继 |
| lucide-react | lucide-vue-next | 图标一一对应 |
| sonner + ToasterWrapper | vue-sonner | toastQueue（纯 TS）不动，仅重写渲染包装 |
| next-themes | @vueuse/core `useDark` | 必须对齐既有 localStorage 键与 class 策略，保证老用户主题偏好无损 |
| @tanstack/react-form | @tanstack/vue-form | 共享 core |
| @tanstack/react-table | @tanstack/vue-table | 共享 table-core，`useBasicModelTable` 迁移为 composable |
| virtua | virtua（保留） | 原生提供 `virtua/vue` |
| react-resizable-panels | splitpanes（备选自研） | 仅 `Splitter.tsx` 一处使用，见开放问题 |
| react-masonry-css | CSS columns 或 vue-masonry-wall | 见开放问题 |
| react-masonry-css 之外的布局 | — | Grid/Splitter 逻辑属业务组件，随页面迁移 |

### D6. i18n：保留 i18next 核心，新增 `useT()` 适配层

已验证：项目类型化选择器语法 `t($ => $.common.x)` 来自 **i18next v25 核心** 的 `CustomTypeOptions.enableSelector`（见 `src/@types/i18next.d.ts`），与 react-i18next 无关，类型安全完整保留。方案：

- `services/i18n.ts` 仅移除 `initReactI18next` 注册，英文第一公民、按需加载、缓存、重试逻辑零改动
- 新增 `src/composables/useT.ts`：基于 `i18n.on('languageChanged')` 的版本计数 ref 触发重算，暴露与现 `useTranslation()` 等价的 `t`
- 类型生成（`generate-i18n-types`）与 `check-i18n` lint 脚本无需变更

### D7. 构建工具链切换

- Vite：`@vitejs/plugin-react` + babel react-compiler → `@vitejs/plugin-vue`；manualChunks 中 `vendor-react`/`vendor-redux`/`vendor-router` 分组改为 `vue`/`pinia`/`vue-router`/`@vueuse`/`reka-ui` 对应分组，chunk-init 与 highlight.js 分包规则不动
- TypeScript：`jsx: react-jsx` 移除；类型检查引入 `vue-tsc`（`pnpm tsc` 脚本替换为 `vue-tsc --noEmit`）
- Lint：oxlint 继续负责 `.ts`；`.vue` SFC 支持视 oxlint 实际能力决定是否补充 eslint-plugin-vue（开放问题）
- 覆盖率：`coverage.include` 增加 `src/**/*.vue`，排除清单（UI 原子组件等）按 shadcn-vue 新路径同步，分模块阈值不降

### D8. 测试迁移策略

- `@testing-library/react` → `@testing-library/vue`，`jest-dom` 与 `user-event` 保留，happy-dom 环境保留
- 纯逻辑测试（services/utils/store-storage/config/router 配置）保留——router 配置测试改为断言 vue-router 路由表
- 测试基建重写：`helpers/render/redux.tsx`（Provider 包裹）→ `createTestingPinna`/`setActivePinia` 注入；`mocks/router.tsx`、`mocks/virtua.tsx`、`mocks/panelLayout.tsx`、`mocks/navigation.tsx` 等 React mock 重写为 Vue 版；`mocks/i18n.ts` 适配 `useT`
- 组件/hook 测试（89 个 `.test.tsx`）随所属组件迁移为 `.test.ts`（`@testing-library/vue` + mount）
- 集成测试（`vitest.integration.config.ts`）与性能测试（render 计数、流式渲染）语义对等迁移；Stryker 变异测试迁移后重新评估对 `.vue` 的覆盖范围

## Risks / Trade-offs

- [大规模重写引入静默回归] → 以"页面为单位、行为对等测试先行"推进；纯逻辑层测试（不动代码）天然充当回归网；合并前执行完整 `test:all` + 桌面端手动冒烟
- [shadcn-vue 与现 shadcn 组件 props/事件命名差异（如 onOpenChange → @update:open）] → 建立 `ui/` 组件替换清单，逐组件对照迁移并随组件测试验证
- [主题偏好兼容：next-themes 存储键/取值与 useDark 默认行为不一致] → 实现时实测迁移前存储产物，显式对齐键名与 `light/dark/system` 取值
- [RTK → Pinia 语义差异导致状态边界 bug（不可变 vs 可变、中间件时序）] → 以现有 slice/middleware 测试为基准逐条移植断言；持久化订阅的触发时机（同步/批量）需专门验证
- [oxlint 对 `.vue` 支持不足造成 lint 空窗] → 备选方案 eslint-plugin-vue 仅覆盖 SFC，oxlint 继续管 `.ts`
- [长周期分支与 main 漂移] → 迁移期间冻结视图层大重构，定期 rebase main；框架无关层的 main 侧改进可无冲突合入
- [bundle 体积与性能回退（Vue 运行时 vs React+Compiler）] → visualizer 对比基线；聊天流式渲染、虚拟列表滚动做性能对等测试

## Migration Plan

1. 从 main 切出 `feat/vue3` 分支，迁移期间 main 正常演进（仅框架无关层）
2. 阶段一（脚手架可编译）：依赖替换、Vite/tsconfig/入口/main.ts、App.vue 启动流程、vue-router 路由表、Pinia 骨架与持久化订阅、useT 适配层——此阶段允许页面为占位组件
3. 阶段二（UI 基建）：shadcn-vue 组件库 30 个组件落位 + cn/cva 工具 + 主题（useDark 对齐）+ vue-sonner + 测试基建（render helper、Vue 版 mocks）
4. 阶段三（按页面迁移）：Chat（含面板/气泡/流式渲染/虚拟列表，最重）→ Model（表格/表单）→ Setting（表单/供应商卡片）→ NotFound/通用组件收尾；每页面对应迁移其组件测试与集成测试
5. 阶段四（清理与门禁）：移除 React 全部依赖与死代码、更新 vite manualChunks/覆盖率排除、knip/stryker 复核、AGENTS.md 与 README 双语及 docs/design 同步
6. 验收：`pnpm validate`、`pnpm test:basic:all`、`vue-tsc`、`pnpm tauri build` 产物冒烟（聊天收发/模型增删/设置/主题/语言切换）
7. 回滚策略：分支未合入前 main 零影响；验收不达标则废弃分支，无数据迁移风险（存储格式未变）

## Open Questions

- Splitter 的分栏方案：splitpanes 引入 vs 参考 react-resizable-panels 自研轻量实现——实现该组件时以交互对等为准择一
- masonry 布局替代：CSS columns（零依赖）vs vue-masonry-wall——影响范围小，迁移对应组件时定
- 是否引入 eslint-plugin-vue 补齐 SFC lint——取决于届时 oxlint 的 `.vue` 支持度
- Stryker 对 `.vue` 文件的变异测试覆盖范围——迁移完成后评估，必要时将变异目标调整为纯逻辑层
