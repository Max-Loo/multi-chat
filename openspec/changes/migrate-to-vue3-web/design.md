# Design

## Context

现状关键事实（决定方案的约束，动机见 proposal.md - Why）：

- **React 侧规模**：`src/` 非测试代码 191 文件 / 约 2.1 万行——components 50（含 28 个 shadcn/Radix 组件）、pages 49、hooks 16、store 18（Redux Toolkit 7 个 slice + 3 个持久化 middleware）、services 20、utils 27；测试 178 文件 / 约 5.15 万行。
- **Tauri 侧已被隔离**：无自定义 Rust 命令、无 `invoke()`；全部 `@tauri-apps` 依赖收敛在 `src/utils/tauriCompat/` 10 个文件内（http/os/shell/store/keyring/环境检测/迁移/共享工具），10 个业务消费方经 barrel 导入；Web 降级实现（IndexedDB store、IndexedDB+AES-GCM keyring、原生 fetch、`navigator.language`、`window.open`）全部就绪且已有规格覆盖。
- **框架无关层占比高、可直接复用**：聊天服务层（Vercel AI SDK v6 `streamText` 流式 + 供应商动态加载 + 元数据收集）、`services/modelRemote/`、i18n 核心（i18next + 懒加载/缓存/防竞态/重试，389 行）、`utils/crypto.ts`（Web Crypto AES-256-GCM）、存储层（chatStorage 分键布局 / modelStorage 加密字段）、初始化流程（InitializationManager + initSteps）、时间戳/剪贴板等工具。
- **既有 Web 发布链路**：`web:dev`/`web:build` 脚本、GitHub Pages 部署（BASE_PATH 子路径）、4 条 Vite dev 代理（deepseek/kimi/zhipuai/zhipuai-coding-plan）已存在。
- **测试基建**：Vitest 4 + happy-dom + fake-indexeddb + Stryker 9（mutate 28 个文件）；测试约定（测用户可见行为、仅 mock 系统边界）记录在 `src/__test__/README.md`。

## Goals / Non-Goals

**Goals:**

- 单一 Vue 3（组合式 API + `<script setup>`）纯浏览器前端；删除 React 运行时与 Tauri 桌面壳。
- 最大化复用框架无关层（services / utils / 存储与加密 / 初始化流程），UI 层与状态绑定层等价重写。
- 既有 Web 用户数据零迁移（IndexedDB 库名、localStorage 键、数据布局全部不变）。
- URL 路由结构、交互行为、i18n 行为、测试约定等价延续。

**Non-Goals:**

- 不引入生产代理或任何后端服务（CORS 限制维持现状并文档化，见 Risks）。
- 不做 React/Vue 双框架共存的渐进迁移。
- 不提供桌面版（plugin-store JSON 文件）数据迁移工具。
- 不重构业务功能、不改变视觉设计。

## Decisions

### 1. 迁移策略：长期分支上一次性整体替换，不做双框架共存

191 个文件全量 UI 重写；双框架共存需同时维护两套路由/状态/测试基建与状态桥接，任何中间态都不可发布，复杂度远超收益。实施形态：在 `feat/vue3-web` 分支按 tasks 阶段推进，main 期间保持可发布；完成后一次性合入。

备选（否决）：按页面渐进迁移（Vite 双插件 + 状态桥）——Redux/Pinia 桥接与双测试栈成本高，且"迁移窗口内任何中间态不可发布"使渐进失去意义。

### 2. 平台层先行独立合入：`tauriCompat` 收敛为 `src/platform/` 并删除 Tauri 分支

平台层收敛与 React 无耦合，可先于 Vue 迁移独立完成并发布验证（Web 行为不变）：

- `http.ts`：删除 plugin-http 动态 import 与顶层 `createFetch` 环境选择，`fetch` 恒为 `window.fetch`；`getFetchFunc` 签名不变（AI SDK 的 fetch 注入点无感）。
- `store.ts` / `keyring.ts`：删除 Tauri 实现类与 `isTauri()` 三元分发，Web 实现成为唯一实现；类型自持（本地定义 `StoreCompat`/`KeyringPublicAPI` 等类型，删除对 `@tauri-apps/plugin-store`、`tauri-plugin-keyring-api` 官方类型的 re-export）。
- `os.ts`：`locale()` 直接返回 `navigator.language`；`shell.ts`：保留 `window.open` 外链行为，删除 `Command.create` Null Object（唯一消费方 `useNavigateToExternalSite` 只用 `open`）；`env.ts`：删除 `isTauri()`，保留 `isTestEnvironment`/`getPBKDF2Iterations`；`keyringMigration`/`crypto-helpers`/`indexedDB` 不变。
- 导入路径 `@/utils/tauriCompat` → `@/platform`（10 个消费方 + vite/tsconfig 别名无需改，仍是 `@/` 前缀 + 子路径 + 测试 mock 路径更新）。

备选（否决）：保留 `tauriCompat` 目录名仅删分支——名称与语义冲突，误导后续维护（暴露冲突，不做折中）。

### 3. 状态管理：Redux Toolkit → Pinia，持久化时机等价

7 个 slice 1:1 映射为 7 个 Pinia store（models/chat/chatPage/appConfig/modelProvider/settingPage/modelPage）；`RootState` 手写接口类型改为各 store 的类型推导。3 个持久化 middleware（saveChatList/saveModels/saveDefaultAppLanguage）改为各 store 内 `$subscribe` 订阅或 action 显式保存——**存储布局不变**（`chat_index` 索引 + `chat_<id>` 分键、模型 apiKey 字段主密钥加密、语言缓存键），这是数据零迁移的关键约束。thunk（chatSlices 内 3 处 `streamChatCompletion` 调用）改为 store 内 async action。

备选（否决）：Redux Toolkit 在 Vue 中继续使用——生态与心智绑定 React，违背迁移目标。

### 4. UI 组件库：shadcn-vue（reka-ui）+ Tailwind v4 保持

现有 UI 全部是 shadcn/Radix + tailwind class，shadcn-vue 同名同风格，样式 token 与 `main.css`/tw-animate-css 直接复用。替换映射：

| 现有 | 替换 | 说明 |
| --- | --- | --- |
| `@radix-ui/*` 28 个组件 | shadcn-vue（reka-ui 内核） | 逐组件等价迁移，class 复用 |
| `lucide-react` | `lucide-vue-next` | 图标名一致 |
| `sonner` | `vue-sonner` | 同 API，Toast 队列封装 `services/toast/` 不变 |
| `next-themes` | 自研 `useTheme` composable | localStorage 键与 `document.documentElement` class 方案保持，兼容既有用户主题设置 |
| `@tanstack/react-table` | `@tanstack/vue-table` | 同一内核，仅换渲染绑定 |
| `@tanstack/react-form` | 自研轻量 composable（KISS） | 表单逻辑简单，避免引入成熟度不足的绑定 |
| `react-masonry-css` | CSS `columns` | 供应商卡片瀑布流 |
| `react-resizable-panels` | `vue-resizable-panels` | 社区官方推荐移植 |
| `virtua` | `virtua`（Vue 版入口） | 同一库官方支持 Vue，虚拟滚动行为一致 |

备选（否决）：Element Plus / Naive UI 整库替换——视觉重设计成本高，违背"交互行为等价"目标。

### 5. 路由：vue-router 4，路由树 1:1 迁移

`createWebHistory`（basename 取 `import.meta.env.BASE_URL`，与现状一致）；懒加载 `() => import()`；index 重定向（`/`→`chat`、`/model`→`table`、`/setting`→`common`）、`*`→`/404` 兜底、DEV-only `toast-test` 路由按 `import.meta.env.DEV` 条件注册，全部等价实现。

### 6. i18n：保留 i18next 核心，仅替换渲染绑定

`services/i18n.ts` 的懒加载/缓存/防竞态/重试逻辑与 24 个语言 JSON 原样保留；`react-i18next` 的 `useTranslation` 等价物使用官方 Vue 绑定 `i18next-vue`（`$t` + `useTranslation` composable），语言检测链（localStorage → `navigator.language` → en）中 `locale()` 已由平台层提供。

备选（否决）：迁移到 vue-i18n——需重写资源加载策略与语言检测链，收益为零。

### 7. 构建与工具链

- **vite.config.ts**：`@vitejs/plugin-react` + babel React Compiler → `@vitejs/plugin-vue`（Vue 响应式系统天然消除手写 memo 需求，无需编译器优化）；manualChunks 重写（vendor-react/vendor-tauri/radix → vendor-vue/pinia/vue-router/reka-ui）；删除 Tauri 约定（1420 strictPort、watch ignore `src-tauri`、`TAURI_DEV_HOST`）；**保留** 4 条 dev 代理与 `BASE_PATH`/base 逻辑。
- **类型检查**：`tsc` 脚本替换为 `vue-tsc --noEmit`；tsconfig 移除 jsx 选项、增加 `.vue` shim（或由 vue-tsc 处理）。
- **Lint**：`.oxlintrc.json` react 插件 → vue 插件；ignore 清单移除 `src-tauri`。
- **package.json scripts**：`dev`=`vite`、`build`=`vue-tsc --noEmit && vite build`；删除 `tauri`/`web:dev`/`web:build`/`web:build:tauri` 别名（`deploy:gh-pages` 改用主 `build`）；`scripts/update-version.js` 版本同步三处（package.json/tauri.conf.json/Cargo.toml）收敛为仅 package.json。
- **测试**：Vitest + happy-dom + fake-indexeddb 不变；`@testing-library/react` → `@vue/test-utils`（沿用 getByRole 优先的查询与行为断言约定）；Stryker mutate 清单与覆盖率排除清单按新路径重建（tauriCompat 相关"系统 API 依赖"排除项随平台层收敛移除）。
- **依赖增删**：删 react/react-dom/@reduxjs/toolkit/react-redux/react-router-dom/react-i18next/@radix-ui/* 14 项/lucide-react/sonner/next-themes/react-masonry-css/react-resizable-panels/@tanstack/react-form/@tanstack/react-table/@tauri-apps/* 5 项/babel-plugin-react-compiler/@vitejs/plugin-react/@testing-library/react 等；增 vue/pinia/vue-router/@vitejs/plugin-vue/vue-tsc/@vue/test-utils/i18next-vue/lucide-vue-next/vue-sonner/vue-resizable-panels/@tanstack/vue-table/shadcn-vue 系（reka-ui、class-variance-authority 等已有依赖保留）。
- **CI/仓库**：删除 `.github/workflows` 中桌面构建 workflow 与 `src-tauri/` 整目录；gh-pages workflow 构建命令改 `pnpm build`。

### 8. 入口与初始化

`index.html` 内置 Spinner 与三阶段加载保持：HTML Spinner → InitializationManager（initSteps 全部框架无关，原样保留）→ 动态加载主应用挂载。`src/main.tsx` → `src/main.ts`（`createApp(App).use(pinia).use(router).use(i18next-vue)` 挂载），`MainApp.tsx` 的 Provider/router 包装职责消失，由 `App.vue` 承接。

## Risks / Trade-offs

- [生产环境直连 LLM API 受浏览器 CORS 约束（失去 plugin-http 通道）] → 维持与现状 gh-pages 版本一致的限制并文档化（README 与错误提示）；dev 代理保留；生产代理方案明确排除在本变更外，作为后续独立变更候选。
- [Web 密钥环安全性低于系统钥匙串] → 既有 PBKDF2(10 万次)+AES-256-GCM 方案与首次使用安全警告保留，警告文案改为"导出主密钥并妥善备份"导向（沿用 dismissed 标记键兼容已关闭用户）。
- [28 个 UI 组件等价替换存在焦点管理/键盘导航/可访问性差异] → 逐组件对照既有规格（component-accessibility 等 11 条要求）验收；对话框、下拉、表单等关键交互补 Vue 测试用例。
- [178 个测试文件迁移量大] → 分层处理：框架无关测试先行保留通过（仅改 mock 路径），UI 测试随组件迁移逐批重写（断言意图不变）；迁移期间 Stryker 门禁临时放宽，合并前恢复。
- [分支周期长、与 main 漂移] → 平台层收敛 + Tauri 移除先行独立合入（见决策 2），缩小 Vue 分支的变更面；分支期间 main 冻结功能性变更。
- [生态包兼容风险（reka-ui 更名过渡、TanStack Vue 绑定成熟度）] → 锁定经验证版本；Form 场景自研 composable 降险；virtua 用官方 Vue 入口并对照滚动行为手测。
- [`openspec/specs/http-fetch-compat/spec.md` 主规格为历史遗留的 delta 头格式（校验 INFO）] → 本变更 apply 阶段先修复主规格结构（`## ADDED Requirements` → `## Requirements` + 补 Purpose），否则归档将被拒绝；属规格维护，不影响实现。

## Migration Plan

1. **阶段 0（独立可发布）**：平台层收敛为 `src/platform/` + 删除 Tauri（依赖、`src-tauri/`、脚本、CI、文档）；React 版继续在 main 正常构建发布，验证纯 Web 行为。
2. **阶段 1**：切分支 `feat/vue3-web`，构建链与脚手架切换（Vue 插件、Pinia、vue-router、tsconfig/lint/测试栈），空白 Vue 应用可跑通 dev/build/test。
3. **阶段 2**：服务层接入（i18next-vue 绑定、Pinia store + 等价持久化、InitializationManager 挂载流程），框架无关测试恢复全绿。
4. **阶段 3**：UI 层逐域迁移：ui 基建组件（28 个 shadcn-vue）→ Layout/导航/侧栏 → Chat 域 → Model 域 → Setting 域 → NotFound；每域迁移附带等价测试。
5. **阶段 4**：清理（React 依赖删除、死代码 knip 扫描、Stryker 恢复、版本脚本）、全量回归、数据兼容验证（用迁移前构建产物造数据，验证 Vue 版读写）。
6. **回滚**：main 在合并前始终部署旧 React 版；合并前对 React 最后版本打 tag（v0.5.x 系列）作为回退点；阶段 0 独立合入，若 Vue 迁移中止，纯 Web 化成果不受损失。

## Open Questions

- `next-themes` 的主题持久化 localStorage 键名需在阶段 3 实测确认（默认 `theme`）；`useTheme` composable 读取同一键以兼容既有用户设置，若键名不同则做一次性兼容读取。不改变规格与任务结构。
- DEV-only `toast-test` 页面在 Vue 路由树中的条件注册细节。实现细节，不阻塞。
