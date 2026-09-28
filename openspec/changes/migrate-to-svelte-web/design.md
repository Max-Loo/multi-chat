# Design

## Context

项目为纯浏览器 SPA（React 19 + Redux Toolkit + Radix/shadcn + Vite 7 + Tailwind 4），部署于 GitHub Pages 子路径 `/multi-chat/`（`public/404.html` 提供 SPA 刷新回退）。前序变更 `migrate-to-vue3-web` 的阶段 0 已合入 main：Tauri 依赖与 `src-tauri/` 已删除，`src/utils/tauriCompat/` 已更名为 `src/platform/`（IndexedDB / Web Crypto / 原生 fetch 单实现）。残留的 Tauri 痕迹仅有：6 处源码注释、`stryker.config.json` 失效排除路径、`.vscode/extensions.json` 桌面扩展推荐、测试 Mock 工厂中的 Tauri Mock、以及 5 个主规格中未同步的 Tauri 需求正文（其中 `tauri-compat-tests` 主规格本身仍是历史 delta 格式，见验证 INFO）。

规模事实：`src/` 下 189 个 `.tsx`（components 约 50、pages 46、hooks 16 中 3 个 tsx）、约 217 个 `.ts`（服务 / 存储 / 工具 / Redux slices）、177 个测试文件。聊天服务 `src/services/chat/` 基于 `ai` SDK 核心函数 `streamText`（async generator 封装 `streamChatCompletion`），与框架无关，可原样保留。

## Goals / Non-Goals

**Goals:**

- 单一框架终态：Svelte 5（runes）+ 少量高保真生态库，产物无 React 运行时
- 用户可见行为零变化：URL 结构、既有用户数据、i18n、主题、聊天流程全部延续（见 `specs/svelte-frontend/spec.md`）
- 存储布局不变：IndexedDB 库名 / 键结构 / localStorage 键名原样读写
- 顺手完成 Tauri 残留收尾（代码、配置、测试基建、主规格五个）

**Non-Goals:**

- 不重写业务逻辑层（services / store/storage / utils / platform / crypto 仅适配调用方）
- 不改存储格式、不引入数据迁移脚本
- 不重设计 UI（样式 class 与 Tailwind 体系原样复用）
- 不处理生产环境 CORS（维持现状与文档表述）
- 不在本变更内重写全部历史组件测试规格（过时的测试类主规格留待后续治理，本变更只保证行为等价覆盖）

## Decisions

### D1：Svelte 5 runes 模式，而非 Svelte 4 legacy stores

Svelte 5 是当前唯一主线版本，runes（`$state` / `$derived` / `$effect`）是其长期方向；跨组件状态用 `.svelte.ts` 响应式模块承载，替代 Redux 的 store / selector / dispatch 三件套。不引入 Svelte 4 的 writable/store 语法，避免新旧两套响应式并存。
*备选：Pinia 式外部状态库（svelte 状态库生态不成熟）——否决，runes 模块已是官方推荐且零依赖。*

### D2：一次性分支重写，而非渐进共存

React 与 Svelte 组件无法共存于同一渲染树（无实用的桥接方案），增量迁移不成立。沿用前序变更验证过的分支策略：`main` 保持可发布的 React 版本，`feat/svelte-web` 分支上完成切换后整体合入。每个 UI 域（Layout / Chat / Model / Setting）在分支内分批提交并独立可测。
*备选：微前端 / Web Components 渐进迁移——否决，复杂度远超单页应用收益。*

### D3：自研轻量 runes 路由，保持路径式 URL

既有 URL 结构（`/chat`、`/model/table`、`/setting/common`、`/404` 兜底、`BASE_URL` basename、DEV-only `toast-test`）与 `public/404.html` 刷新回退是外部可见行为，必须原样保留。
*备选：svelte-spa-router——否决，hash 路由改变 URL 结构；svelte-routing——否决，嵌套路由与懒加载支持弱且维护停滞；TanStack Svelte Router——否决，为 10 条路由引入重量级依赖。* 自研路由约百余行：HTML5 history + basename + 路由表（含 `lazy()` 动态导入）+ runes 响应式当前路由，实现复杂度低于引入和适配第三方路由。

### D4：状态层——7 个 Redux slice 1:1 映射为 7 个 runes 状态模块

`slices/*.ts` → `store/state/*.svelte.ts`（chat / chatPage / model / modelPage / modelProvider / settingPage / appConfig）；`selectors/` 被 `$derived` 天然取代；3 个持久化 middleware（saveChatList / saveModels / saveDefaultAppLanguage）改为状态模块内的显式保存调用点（与现状写入时机等价：变更即保存）。`RootState` 手写类型改为模块状态类型推导。存储层 `src/store/storage/` 不动。
*备选：保留 Redux（@reduxjs/toolkit 本身框架无关，可配 svelte 订阅）——否决，保留 Redux 会保留其全部样板与心智负担，与迁移目标相悖。*

### D5：UI 组件——shadcn-svelte（bits-ui）复刻既有 shadcn/ui 组件集

28 个 shadcn/ui 组件的样式 class（Tailwind + cva + tailwind-merge）原样迁移，交互内核从 Radix 换为 bits-ui（shadcn 官方 Svelte 版，无障碍行为对齐 Radix）。配套替换：`lucide-react` → `@lucide/svelte`；`sonner` → `svelte-sonner`（保留 `toastQueue` 封装层，API 面不变）；`next-themes` → 自研 runes 主题模块（实测确认既有 localStorage 主题键名并兼容）；`react-resizable-panels` → `paneforge`（react-resizable-panels 的 Svelte 5 移植）；`react-masonry-css` → CSS columns；`@tanstack/react-form` / `react-table` → 官方 `@tanstack/svelte-form` / `svelte-table`（headless 核心 identical，逻辑层复用）；`virtua` 保留（官方支持 Svelte 5）。

### D6：i18n——保留 i18next 核心 + 薄 runes 封装

`services/i18n.ts` 核心、24 个语言 JSON、`generate-i18n-types` 脚本、`lint:i18n` 检查全部原样保留；仅替换 react-i18next 绑定层为 `.svelte.ts` 模块导出的响应式 `t` / 当前语言状态（订阅 i18next `languageChanged` 事件）。
*备选：换 svelte-i18n 库——否决，需重写全部翻译键加载逻辑与类型生成脚本，收益为零。*

### D7：构建链与类型检查

`@vitejs/plugin-react` + `babel-plugin-react-compiler` → `@sveltejs/vite-plugin-svelte`；`build` = `svelte-check && vite build`（类型检查由 tsc 单独负责 `.ts` 的现状，收敛为 svelte-check 统一覆盖 `.ts` + `.svelte`）；`manualChunks` 按 chunk-splitting 规格的「包名精确提取」策略重写映射表（vendor-react / vendor-redux / vendor-radix → vendor-svelte / vendor-bits-ui / vendor-router 等）；`tsconfig` 移除 jsx 配置、增加 svelte 条件；`.oxlintrc.json` 移除 react 专属规则。

### D8：测试栈

`@testing-library/react` → `@testing-library/svelte`；vitest + happy-dom + fake-indexeddb + Stryker（vitest runner）全部保留；`src/__test__/helpers/` 工厂与 mock 移除 Tauri Mock 并适配 Svelte 挂载方式。组件测试重写范围按「既有行为测试等价迁移」执行：凡断言用户可见行为的既有用例，必须在 Svelte 栈下有等价用例。

### D9：Tauri 残留收尾与主规格修复

代码层：清理 6 处 Tauri 注释（`clipboard.ts` / `global.ts` / `chat/types.ts` / `chatStorage.ts` / `storeUtils.ts` / `pagination.tsx`）；`stryker.config.json` 移除 tauriCompat 与 `src-tauri` 失效排除；`.vscode/extensions.json` 移除 tauri-vscode / rust-analyzer、补 Svelte 扩展。规格层：先修复 `openspec/specs/tauri-compat-tests/spec.md` 的历史 delta 格式（规范化为「Purpose + ## Requirements」主规格结构），使本变更的 REMOVED 增量在归档时能正常应用；`http-fetch-compat` / `web-keyring-compat` / `web-store-compat` / `gh-pages-auto-deployment` 四个主规格的 Tauri 需求由本变更增量移除。

### D10：与前序变更的关系处理

建议在开始实施前先归档 `migrate-to-vue3-web`（其阶段 0 代码已合入 main；其余增量与本变更的平台规格增量内容一致）。若归档时已执行规格同步，则删除本变更中重复的三个平台增量文件（http-fetch / web-store / web-keyring），避免归档冲突；gh-pages 与 tauri-compat-tests 两个增量仍需保留（内容有差异：构建命令、测试能力移除）。

## Risks / Trade-offs

- [规模：189 个组件全量重写，周期长] → 分域分批提交（Layout → Chat → Model → Setting），每域完成即跑该域测试；main 始终保持 React 可发布版本，随时可放弃分支止损
- [第三方库 Svelte 5 兼容性（bits-ui / virtua / paneforge / svelte-sonner / @tanstack/svelte-*）] → 阶段 1 脚手架期即安装并冒烟验证全部关键库，发现不兼容立即在本域内寻找替代，不让风险穿透到 UI 迁移期
- [组件行为回归] → 既有行为测试等价重写 + 每域手动回归清单（聊天全流程 / 模型增删改 / 设置项 / 主题 / 语言切换）；最终以 `svelte-frontend` 规格场景逐条验收
- [自研路由的正确性（嵌套路由、重定向、刷新、404.html 配合）] → 路由基建先行并为每个既有路由场景编写专项测试（含 `/multi-chat/` 子路径直访与刷新），先于任何页面迁移
- [oxlint 对 `.svelte` 文件的解析支持不确定] → 阶段 1 实测：支持则纳入 lint 范围，不支持则 `.svelte` 由 svelte-check 兜底并在 lint 配置中显式排除（记录在 AGENTS.md）
- [数据兼容验证依赖真实历史数据形态] → 阶段 4 用迁移前构建产物（v0.5.x）预造完整用户数据（IndexedDB 双库 + 全部 localStorage 键），Svelte 版逐项验证（聊天 / 加密 apiKey / 语言 / 主题 / 警告 dismissed）
- [变异测试基线失效] → mutate 清单按新文件路径重建，阈值沿用 coverage-threshold-policy 规格，不放松

## Migration Plan

1. **前置**：归档 `migrate-to-vue3-web`（按 D10 处理重复增量）；在 main 发布纯 Web React 最终版本并打 tag（v0.5.x），作为回退锚点与数据兼容验证的数据源
2. **阶段 1**：`feat/svelte-web` 分支安装 Svelte 生态、切换构建链、最小 App 冒烟（dev / build / lint / 单测全链路通）
3. **阶段 2**：路由基建 + 状态层 runes 化 + i18n 封装 + 服务层接入，框架无关测试全绿
4. **阶段 3**：UI 分域迁移（Layout → Chat → Model → Setting → 收尾组件），每域测试等价重写
5. **阶段 4**：React 残留清除（knip）、Tauri 残留清理、stryker 清单重建、数据兼容验证、全量回归、文档同步、合入 main 并打 tag 发布

回退策略：合入前回退 = 丢弃分支；合入后回退 = revert 合并提交并重新部署上一个 tag（用户数据不受影响，存储布局未变）。

## Open Questions

- oxlint 对 `.svelte` 的支持程度（D7/D8 已给出两分支处理，阶段 1 实测定案，不影响规格与任务分解）
- `next-themes` 的既有 localStorage 主题键确切名称（阶段 3 实测确认后兼容，行为要求已由规格固定：切换即时生效并持久化）
