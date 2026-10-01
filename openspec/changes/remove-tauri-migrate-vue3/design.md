# Design：移除 Tauri 并迁移至 Vue3

## Context

- 现状为 React 19 + Tauri 2.0 双栈应用：所有 Tauri 插件调用被隔离在 `src/utils/tauriCompat/`（Null Object / IndexedDB 降级模式），Web 降级实现已完整可用（`web:dev`/`web:build`/`deploy:gh-pages` 链路成熟）；Rust 侧无自定义 command，前端无 `invoke()` 调用。
- 需求/规格层面的现状：主 spec 中 `tauri-plugin-web-compat`、`os-locale-compat`、`http-fetch-compat` 描述双栈行为（规划期已修复其历史结构问题：delta 风格区块头 → `## Requirements`，否则归档会被拒绝）。
- 服务层（`src/services/`）、存储层（`src/store/storage/`、keyring）、工具层（`src/utils/`）基本框架无关，是两个阶段共同的复用基础；React 耦合集中在组件（约 189 个 .tsx）、hooks（`src/hooks/`）、Redux（`src/store/`）、路由（`src/router/`）、入口（`src/main.tsx`/`MainApp.tsx`）。

## Goals / Non-Goals

**Goals**

- 阶段一：项目成为可运行、可验证的纯 Web React 应用（Tauri 依赖与代码完全移除）。
- 阶段二：完成 React → Vue3（组合式 API）重写，核心功能与 URL 语义对等，测试套件迁移后通过。
- 全程保持用户数据兼容（IndexedDB/localStorage 结构不变）。

**Non-Goals**

- 不做 UI 视觉重设计（样式体系 Tailwind + CVA 原样保留）。
- 不改动业务逻辑与服务层算法（聊天流处理、加密、初始化流程仅替换平台适配点）。
- 不重写翻译资源与 i18n 检查脚本。
- 不在本 change 中给 `tauriCompat` 目录改名（纯路径改名留作后续独立小变更，避免行为变更与外观 churn 混杂）。
- 不新增任何产品功能。

## Decisions

### D1：两阶段交付，阶段间保持可运行（采纳）

阶段一仅移除 Tauri（React Web 版可运行、可发布）；阶段二在独立分支上做框架重写，完成并验证后才并回。
备选：大爆炸一次性重写（否决：中间态不可运行，验证只能压到最后，回归风险不可控）。

### D2：Tauri 移除方式——删原生分支，保留兼容层目录名（采纳）

- `src/utils/tauriCompat/` 中删除各模块的 Tauri 原生实现类与 `isTauri` 分支，Web 实现类成为唯一实现；`env.ts` 仅保留测试环境检测。
- `http.ts` 整个包装层删除，调用点改用全局 `fetch`（`providerFactory` 注入 AI SDK 的 `fetch` 参数、`modelRemote`、`useNavigateToExternalSite`→`window.open`、`global.ts`）。
- 目录名 `tauriCompat` 保留（决策见 Non-Goals）。
备选：同步改名为 `webPlatform`（否决：纯机械重命名会产生大量无关 diff，掩盖行为变更的审查焦点）。

### D3：Vue3 生态映射表（采纳）

| 现有 | 目标 | 说明 |
| --- | --- | --- |
| react-dom `createRoot` | `createApp` | 入口重写，初始化流程结构保留 |
| Redux Toolkit（7 个 slice + reselect 选择器 + 3 个 middleware） | Pinia（setup store 风格） | 每个 slice 对应一个 store；选择器改为 store getter/computed；middleware 迁移为 store `$onAction` 订阅或独立组合式函数 |
| react-router-dom（createBrowserRouter + lazy） | vue-router（createWebHistory + basename） | 懒加载用 `() => import()` 路由组件；`import.meta.env.BASE_URL` 处理逻辑保留 |
| Radix UI（约 27 个 ui 组件） | Reka UI（shadcn-vue） | `src/components/ui/` 整体重生成，导出 API 保持与现有一致的组件名与 props 语义 |
| @tanstack/react-form / react-table | @tanstack/vue-form / vue-table | 官方 Vue 适配，headless 逻辑复用 |
| sonner | vue-sonner | `toastQueue` 服务保持框架无关，仅替换渲染组件 |
| lucide-react | lucide-vue-next | 图标名一一对应 |
| react-resizable-panels | paneforge | shadcn-vue Resizable 的底层实现 |
| react-masonry-css | CSS multi-columns | 无需额外依赖；若行为不满足 `masonry-layout` spec 场景再引入等价库 |
| virtua（React） | virtua（Vue 版） | 同一作者，官方提供 Vue3 组件 |
| next-themes | 自研 `useTheme` 组合式函数 | 保持现有 `dark` class 策略与 localStorage 持久化语义 |
| react-i18next | i18next core + 自研 `useTranslation` | 基于 `i18n.on('languageChanged')` 驱动 Vue ref；`initReactI18next` 移除；`src/services/i18n.ts` 的按需加载/缓存逻辑保留 |
| @testing-library/react | @testing-library/vue | MSW、fake-indexeddb、happy-dom 保留 |
| babel-plugin-react-compiler | 移除 | 性能语义由 Vue 响应式系统承担 |

备选（组件层）：PrimeVue（否决：视觉体系差异大，样式重做成本高）；纯手写（否决：可访问性风险与工作量最大）。

### D4：Hooks → Composables 一一映射（采纳）

`src/hooks/` 全部转为 composables，保留 `useXxx` 命名与签名语义；`redux.ts`（`useSelector`/`useDispatch`）删除，调用点改为直接使用 Pinia store + `storeToRefs`。

### D5：入口与初始化流程结构保留（采纳）

`main.ts` 保留现有四阶段语义：HTML Spinner → 顶层 `await import('./config/initSteps')` → 初始化控制器组件（Vue 版）逐步执行并展示动画 → 完成后动态加载主应用。`InitializationController`、`FatalErrorScreen` 等初始化期组件优先迁移，作为阶段二的第一个纵向切片。

### D6：测试分层处置（采纳）

- 直接保留（框架无关）：`src/__test__/utils`、`services`、`store/storage`、`config` 等非渲染测试。
- 重写（渲染相关）：`components`、`pages`、`hooks`、`router` 及依赖 Redux mock 的 store 测试，迁到 `@testing-library/vue` + Pinia 测试模式；mock 工厂（`helpers`）中 React 专供部分重写。
- 阶段二期间将 stryker 变异测试范围临时收窄到未迁移层，迁移完成后恢复全量并复核覆盖率阈值。
备选：迁移期维持全量测试门禁（否决：中间态必然红，门禁失去信号意义）。

### D7：构建配置（采纳）

`vite.config.ts`：`@vitejs/plugin-react` → `@vitejs/plugin-vue`；manualChunks 映射表更新（`vendor-vue`/`vendor-pinia`/`vendor-router` 取代 react/redux 组）；移除 `TAURI_DEV_HOST`。类型检查：`web:build` 中 `tsc` → `vue-tsc --noEmit`（SFC 类型检查）；`tsconfig` 移除 JSX 配置。

### D8：pinia 4 组件外使用的插件安装（实施期发现，采纳）

项目安装的 pinia 为 v4：`pinia.use()` 在 app 实例不存在（`_a == null`，组件外使用场景）时会把插件放入待安装队列，仅在 `app.use(pinia)` 时才真正安装。初始化流程与单元测试都在组件外使用 store，持久化/自动命名等插件会静默失效。`createAppPinia()` 工厂在无 app 时手动调用 `pinia.install(stub)` 冲刷队列（真实应用挂载时 `app.use(pinia)` 幂等，无害）。

## Risks / Trade-offs

- [阶段二工作量大（约 189 组件 + 178 测试文件），周期长] → 按纵向切片推进（基础设施 → ui 基础组件 → Layout/导航 → Chat → Model → Setting），每切片独立可验证；服务/存储层全程复用。
- [组件行为回归] → 迁移前对照既有 spec 场景清单逐组件验收；关键交互先补行为测试再动手。
- [Reka UI 与 Radix 的 API 差异（事件名、受控语义、插槽模型）] → 差异封闭在 `src/components/ui/` 一层，业务组件只依赖封装后的稳定 API。
- [自研 i18n 组合式函数遗漏响应式订阅，语言切换不刷新] → 以 `vue3-app-foundation` spec 的"语言切换即时生效"场景作为强制验收测试。
- [paneforge / virtua Vue 版 / CSS columns 与原实现行为差异] → 涉及组件（可调面板、虚拟滚动、瀑布流）单独按对应 spec 场景验收。
- [阶段二测试门禁放宽造成质量空洞] → 变异测试收窄是临时措施并记录范围；每切片完成即恢复该切片的测试门禁。
- [GH Pages + history 路由的深链刷新] → 沿用现有 basename 与 404 回退方式，行为与现状一致。

## Migration Plan

1. **阶段一（Tauri 移除，主干直做，小步提交）**：删 `src-tauri/` 与 Tauri 依赖 → 兼容层收敛（D2）→ fetch 包装层移除与调用点更新 → `package.json` scripts/`vite.config` 清理 → 全量 `build` + `test:run` 验证 → AGENTS.md / docs 同步。回滚：git revert。
2. **阶段二（Vue3 重写，独立分支）**：基础设施（D7、入口 D5、router、pinia、i18n 封装）→ ui 组件库（D3）→ Layout/导航 → Chat → Model → Setting → hooks 清点收尾 → 测试迁移与 React 依赖摘除 → 全量验证后并回主干。回滚：分支丢弃即回退，主干始终保有阶段一的可用版本。

## Open Questions

- masonry 布局最终采用 CSS columns 还是等价库：实现期按 `masonry-layout` spec 场景验证后定，不影响契约与任务拆分。
- 表格虚拟化在 `@tanstack/vue-table` + virtua 组合下的具体组装方式：实现细节，验收以既有模型表格行为为准。
