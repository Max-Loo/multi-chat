# Design

## Context

当前代码库为 React 19 + Redux Toolkit + react-router v7 + Radix/shadcn 的 Tauri 应用，约 414 个 TS/TSX 文件。关键现状约束：

- **Rust 端是纯插件壳**：`src-tauri/src/lib.rs` 仅初始化插件（http/os/opener/store/shell/keyring/fs），无自定义命令，移除无业务损失。
- **Web 路径已被完整验证**：`src/utils/tauriCompat/` 六个模块均有完整 Web 实现（IndexedDB、Web Crypto、浏览器 fetch、navigator.language、Null Object），`web:dev`/`web:build`/gh-pages 部署链路已存在，相关行为由 `web-keyring-compat`、`web-store-compat` 等 specs 覆盖。
- **服务层框架无关**：`services/chat`、`services/modelRemote`、`services/initialization`、`services/toast`（队列部分）、`utils/crypto.ts`、`store/storage` 持久化层均为纯 TypeScript，不依赖 React。
- **React 耦合面**：46 个组件 `.tsx`、28 个 shadcn/Radix UI 组件、7 个 Redux slices + 3 个持久化 middleware、16 个自定义 hooks、react-i18next、testing-library/react 测试体系、React Compiler 与 `@vitejs/plugin-react` 构建链。
- **数据兼容底线**：IndexedDB 数据库（`multi-chat-store`、`multi-chat-keyring`）与 localStorage 键（种子、版本标记、语言偏好）是 Web 用户的既有数据，迁移中名称与格式一律不动。

## Goals / Non-Goals

**Goals:**

- 两阶段可独立验证地完成：先纯 Web 化（React 上移除 Tauri），再 Vue 3 迁移；每阶段结束时测试全绿、可构建、可部署。
- 对 Web 端用户做到行为与数据无感：UI 视觉、路由、持久化数据、加密方案全部保持。
- 建立与现状等价的 Vue 工程化底座：构建、类型检查、lint、单测、变异测试、分包与体积监控。

**Non-Goals:**

- 不借迁移重写业务逻辑、不新增功能、不调整 UI 视觉设计。
- 不提供桌面端数据自动迁移工具（浏览器无法访问 Tauri 本地存储，见 proposal）。
- 不迁移到 vue-i18n（保留 i18next 核心，理由见决策 D4）。
- 不引入 Nuxt/SSR、不引入微前端式双框架长期共存架构。

## Decisions

### D1. 执行策略：两阶段推进，Phase 1 独立交付

**决策**：变更分两个可独立验收的阶段：

- **Phase 1（纯 Web 化，仍在 React 上）**：删除 `src-tauri/` 与全部 `@tauri-apps/*` 依赖；`tauriCompat` 收敛为 `webRuntime`（见 D5）；脚本收敛（`dev`/`build` 直指 Vite）；文档同步。完成即合并 main 并发布——立即砍掉双环境维护成本，并单独验证 Web-only 构建/部署全链路。
- **Phase 2（Vue 3 迁移，长分支）**：搭 Vue 骨架（入口、路由、Pinia、UI 底座），再按页面域逐个搬移（Layout → Chat → Model → Setting → 404），最后删除 React 全家桶。

**理由与备选**：一次性混合迁移会把"Tauri 移除"与"框架重写"两个失败域耦合，任何一处回滚都要整体重来；双框架共存过渡（React 页面挂载进 Vue 路由）则需要两套路由与挂载协议，复杂度远超收益。两阶段各自风险独立、验收清晰：Phase 1 合入后，Phase 2 期间 main 始终是可发布的 Web 应用，长分支只需定期 rebase。

### D2. 状态管理：Redux Toolkit → Pinia（1:1 slice 映射）

**决策**：每个 Redux slice 转为同名的 Pinia store（`models`、`chat`、`chatPage`、`appConfig`、`modelProvider`、`settingPage`、`modelPage`）；selector 转 getter/computed；3 个持久化 middleware（聊天列表、模型列表、默认语言自动保存）转为各 store 内 `$subscribe` 订阅或 action 后显式调用既有 `store/storage` 持久化函数——持久化目标与触发时机不变。

**备选**：保留 Redux（其 core 框架无关）仅替换 react-redux 绑定——绑定层仍是 React 心智模型，与组合式 API 组件风格割裂，且失去 Vue devtools 集成；直接用模块级 `reactive()` 单例——放弃 devtools/时间旅行与结构化规范。Pinia 是 Vue 官方标准且 API 与 slices 的"state + reducers + selectors"模型一一对应，转换机械化、可逐 store 验证。

### D3. UI 组件：reka-ui + shadcn-vue 风格，复用 Tailwind 4 与 cva/cn 工具链

**决策**：28 个 `src/components/ui/` 组件按 shadcn-vue（基于 reka-ui）等价重写；`tailwindcss`、`tailwind-merge`、`clsx`、`class-variance-authority`、`tailwindcss-animate` 全部保留，样式类名尽量原样搬运，视觉不变。配套替换：

| 现依赖 | 替换 | 说明 |
| --- | --- | --- |
| `lucide-react` | `lucide-vue-next` | 图标 API 一致 |
| `sonner` | `vue-sonner` | 同作者官方 Vue 版，ToasterWrapper 适配 |
| `@tanstack/react-table` | `@tanstack/vue-table` | 同内核，渲染层适配 |
| `@tanstack/react-form` | `@tanstack/vue-form` | 同内核 |
| `react-resizable-panels` | reka-ui Splitter（或等价实现） | resizable.tsx 重写 |
| `react-masonry-css` | 原生 CSS columns（直接内联样式） | 该库本就是 CSS columns 封装，直接使用 CSS 等价 |
| `virtua` | `virtua`（保留） | 官方支持 Vue |
| `next-themes` | `@vueuse/core` `useDark` + 现有持久化偏好 | 见 D6 |
| `@radix-ui/react-*` | `reka-ui` | reka-ui 为 Radix Vue 更名而来，行为/可访问性同源 |

**备选**：换 Element Plus / Naive UI 整库——视觉与现有 shadcn 风格差异大，等于重做设计系统，违背"视觉不变"目标；全部手写无头组件——工作量与可访问性风险不可接受。

### D4. i18n：保留 i18next 核心，自写组合式桥接

**决策**：`i18next` 核心与全部语言资源、按需加载、缓存校验、Toast 队列、翻译完整性检查（`lint:i18n`）、类型生成脚本（`generate-i18n-types`）原样保留；仅以约 50 行的 `composables/useI18n.ts` 替代 `react-i18next`：封装 `t` 函数、`computed` 化当前语言、订阅 `languageChanged` 事件触发响应式更新。

**备选**：迁移 `vue-i18n`——资源格式（嵌套 JSON vs 现有 key 组织）、加载器、校验脚本、类型生成全部重写，触及 `i18n-*` 十余个 specs 的实现基础，收益仅为"官方 Vue 库"名义。i18next 本就框架无关，react-i18next 只是被替换的薄胶水层。

### D5. 兼容层收敛：`tauriCompat/` → `webRuntime/`，删除双分支

**决策**：目录更名为 `src/utils/webRuntime/`（specs 已按此更新），逐模块处理：

- `env.ts`：删除 `isTauri()`；保留 `isTestEnvironment()`、`getPBKDF2Iterations()` 与 PBKDF2 常量（keyring 测试性能依赖）。
- `http.ts`：`fetch`/`getFetchFunc` 收敛为原生 `window.fetch` 薄封装，保留导出形状（AI SDK 与远程模型获取依赖注入点）。
- `shell.ts`：保留 Null Object（`Command.isSupported()` 恒 `false`、`shell.open()` = `window.open()`）。
- `os.ts`：`locale()` = `navigator.language`；平台检测（macOS Safari 判定）保留。
- `store.ts` / `keyring.ts` / `keyringMigration.ts` / `crypto-helpers.ts` / `indexedDB.ts`：删除 Tauri 动态导入分支，Web 实现成为唯一路径；`ChildProcess` 等类型改为项目内定义。
- 全局替换导入路径 `@/utils/tauriCompat` → `@/utils/webRuntime`；`src/utils/tauriCompat/__mocks__` 同步迁移。

**理由**：保留"兼容层"名字与双分支检查会持续误导后续维护者以为存在桌面环境；Web 实现代码本身已由对应 specs 验证，收敛是纯删除性改动。

### D6. hooks → composables，引入 @vueuse/core 兜底

**决策**：`src/hooks/` 迁移为 `src/composables/`：与组件生命周期/响应式相关的 hooks（`useAdaptiveScrollbar`、`useAutoResizeTextarea`、`useConfirm`、`useMediaQuery`、`useResponsive`、`useScrollContainer` 等）重写为组合式函数；纯逻辑 hooks（`useDebounce`、`useCreateChat`、`useExistingChatList` 等编排服务的）直接平移，仅把 Redux 访问换成 Pinia。媒体查询、防抖、事件监听等通用原语优先使用 `@vueuse/core`（同时承担 D3 中暗色模式职责），避免手写清理逻辑。

### D7. 构建与工具链

**决策**：

- Vite 插件：`@vitejs/plugin-react` + `babel-plugin-react-compiler` → `@vitejs/plugin-vue`（+ `vue-tsc` 做 `.vue` 类型检查，`pnpm tsc` 脚本切换为 `vue-tsc --noEmit`）。Vue 响应式系统为细粒度更新，无 React Compiler 对应物，不寻找替代。
- 分包策略：`vite.config.ts` 的 manualChunks 映射重排——`vendor-react`/`vendor-redux` → `vendor-vue`（vue/pinia/vue-router），`@radix-ui` → `reka-ui`，其余（markdown、ai、i18n、icons、ui-utils）保留；`rollup-plugin-visualizer` 基线对比首屏体积。
- Lint：oxlint 继续负责 `.ts`；`.vue` 若 oxlint 的 vue 支持不足则补充 eslint + eslint-plugin-vue（仅 `.vue`），lint-staged 相应调整。
- 测试：vitest/happy-dom/fake-indexeddb/msw/Stryker 全部保留；`@testing-library/react` → `@testing-library/vue`；组件测试按原测试意图重写（现有 specs 中测试规范条款继续约束写法），框架无关的服务/工具测试原样保留作为迁移正确性锚点。
- 依赖清理在 Phase 2 末尾一次性完成（`react`、`react-dom`、`react-redux`、`@reduxjs/toolkit`、`react-router-dom`、`@radix-ui/*`、`react-i18next`、`lucide-react`、`@tanstack/react-*`、`sonner`、`next-themes`、`react-masonry-css`、`react-resizable-panels`、`babel-plugin-react-compiler`、`@vitejs/plugin-react`、`@testing-library/react`、`@types/react*`），并跑 `knip` 复查。

### D8. 入口与启动流程映射

**决策**：`main.tsx` → `main.ts`：`createApp(App).mount('#root')`；顶层 `await import("@/config/initSteps")` 保留（Vite 顶层 await 已在用）；`InitializationController` → SFC；`createMainApp(result)` 工厂改为根组件 `provide` 初始化结果（或轻量 `initResult` Pinia store），`InitResult` 的 warnings Toast、静默刷新、安全警告等启动副作用平移到 `onMounted`。

### D9. 路由映射

**决策**：`createBrowserRouter` → `vue-router` 的 `createRouter(createWebHistory(base))`，路由表 1:1 迁移（含 index 重定向、嵌套 children、404 兜底、DEV-only toast-test 路由）；页面懒加载 `() => import(...)` 形式保持；`basename` 逻辑（BASE_PATH 处理）平移。URL 行为不变（`chat-deletion-url-sync`、`chat-redirect-on-not-found` 等 specs 继续约束）。

## Risks / Trade-offs

- [约 414 个文件重写引入行为回归] → 迁移前固化测试基线（`pnpm test:basic:all` 全绿作为起点）；框架无关层测试不动，作为持久正确性锚点；每个页面域迁移完成即重写并通过对应用户行为测试后才进入下一域。
- [reka-ui 与 Radix 行为细节差异（焦点管理、ARIA、键盘导航）] → 二者同源，风险集中在 dialog/alert-dialog/select/dropdown-menu 四类复杂组件，迁移时对照现有组件测试逐项人工核验；差异记录到任务清单。
- [Phase 2 长分支与 main 漂移] → Phase 1 先行合并发布，压缩 Phase 2 与 main 的差异面；Phase 2 期间定期 rebase main 并冻结 main 上的 UI 重构类改动。
- [oxlint 对 `.vue` 支持不完整] → 降级方案明确：eslint + eslint-plugin-vue 仅覆盖 `.vue`，`pnpm lint` 聚合两者（D7）。
- [Web-only 后模型供应商 CORS 兼容性成为硬约束] → 现状 Web 版已受同样约束（非新增风险），但在 README 显著标注"部分供应商可能因 CORS 无法在浏览器直连"，并保留现有错误提示路径。
- [首屏体积可能变化] → visualizer 对比 Phase 1 基线；Vue+Pinia 体积小于 React+Redux+Compiler，预期持平或下降，超基线 10% 则回头排查。
- [桌面用户升级断档] → 发布说明以 BREAKING 标注，引导使用密钥导出/数据导出迁移；已在 proposal 与 `pure-web-runtime` spec 声明。

## Migration Plan

1. **Phase 1（React 上纯 Web 化）**：新分支 → D5 兼容层收敛 + 删除 `src-tauri/` + 依赖/脚本清理 + 文档更新 → `pnpm validate` + `pnpm test:basic:all` + `web:build` 全绿 → 合并 main，发布版本（如 `v0.6.0`），gh-pages 验证。
2. **Phase 2（Vue 迁移）**：新长分支 `feat/vue3-migration` → 基建（D7）+ 骨架（D8/D9 + Pinia D2 + i18n D4 + UI 底座 D3）→ 按域迁移（Layout/Sidebar → Chat → Model → Setting → NotFound → 全局组件）→ React 依赖清除 + knip + bundle 对比 → 全量测试（单测/集成/变异）→ 合并 main，发布 `v1.0.0`。
3. **回滚**：任一阶段合并前均以分支隔离，回滚 = 不合并或 revert 单个合并提交；Phase 1 与 Phase 2 互不依赖回滚决策。

## Open Questions

- `@tanstack/vue-form` 与现有 `@tanstack/react-form` 用法的 API 成熟度差异需在迁移 CreateModel 表单时实地确认；若不满足，备选 vee-validate + zod（不改变 spec 层行为）。
- shadcn-vue 官方组件清单与本项目 28 个组件并非一一对应（如 data-table、password-input 为项目自研组合），缺省部分按 reka-ui 原语自写，工作量在任务清单中按组件列出，迁移时逐一核销。
