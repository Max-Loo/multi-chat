# Design

## Context

当前应用为 Tauri 2 + React 19 桌面应用，同时保留 `web:dev`/`web:build` 纯浏览器模式并部署至 GitHub Pages。`tauriCompat` 兼容层（`src/utils/tauriCompat/`）以 Null Object / IndexedDB 降级模式为 5 个 Tauri 插件提供 Web 分支，`src-tauri/` 后端仅 21 行壳代码。前端约 21,000 行：100 个 React 组件（含 28 个 shadcn/ui 基础组件）、7 个 Redux slice、3 个 RTK 监听中间件、17 个自定义 Hook。聊天服务层（`src/services/chat/`）只调用 AI SDK 核心 API（`streamText`/`generateText`），未使用任何 React hook，可原样保留。现状 Web 模式已经使用原生 `fetch` 与 IndexedDB 存储，浏览器环境约束（CORS、存储配额）不是新问题。

约束：迁移必须保持既有 OpenSpec 规格场景（约 230 个能力）描述的行为继续成立；IndexedDB 中的用户数据格式不变、无需迁移即可继续读取；`src/locales/` 翻译资源直接复用。

## Goals / Non-Goals

**Goals:**

- 迁移后应用在纯浏览器环境完整可用，用户可见行为与迁移前 Web 模式一致。
- React 生态与 Tauri 依赖在依赖树中完全清零。
- 既有规格场景可全部在 Vue 测试栈下执行并通过。
- 用户数据（IndexedDB、localStorage 种子、聊天记录）无感保留。

**Non-Goals:**

- 不做 React 与 Vue 双框架共存或渐进式混跑（见决策 D1）。
- 不改变任何业务功能、UI 视觉与交互行为。
- 不引入服务端（保持纯静态部署）。
- 不重写 `src/services/chat/`、`src/services/modelRemote/`、`src/utils/crypto.ts` 等框架无关代码。
- 不新增主题切换 UI（现状无用户可见的主题切换入口，仅做等价技术替换）。

## Decisions

### D1：分支上全量重写，验收后一次性替换，而非双框架共存

React 与 Vue 共享一套路由、状态与 UI 需要微前端级改造，复杂度远超收益。采用：在 `feat/vue3-web` 长分支上按阶段重写，每阶段结束保持"该阶段范围内的测试绿"；全部验收标准（见 tasks 末节）达成后合入 main。合并前在 main 上打 tag `last-react-tauri` 作为回退点。Tauri 移除（阶段 1）与 Vue 迁移（阶段 2+）解耦：阶段 1 可独立合入 main 提前生效。

### D2：Tauri 移除 —— `tauriCompat` 溶解为 Web 专用模块

删除 `src-tauri/` 目录与 5 个 Tauri 依赖后，兼容层各模块去向：

| 现模块 | 去向 |
| --- | --- |
| `http.ts`（Web 分支=原生 fetch） | 删除；调用点直接使用全局 `fetch` |
| `os.ts`（locale） | 删除；语言检测直接读 `navigator.language`（i18n 服务内） |
| `shell.ts`（外链） | 删除；`useNavigateToExternalSite` 组合式函数内直接 `window.open` |
| `store.ts`（IndexedDB 键值存储） | 迁至 `src/utils/webStore/`，删除 Tauri 分支 |
| `keyring.ts` + `keyringMigration.ts` | 迁至 `src/utils/keyring/`，仅保留 IndexedDB + AES-256-GCM 实现 |
| `crypto-helpers`/`env.ts` 共享部分 | 迁至上述两模块共享的 `src/utils/webCommon/`（`initIndexedDB`、`encrypt`/`decrypt`、`PasswordRecord`、`isTestEnvironment`、PBKDF2 常量） |

理由：模块名不再背负"Tauri 兼容"语义，但数据库名（`multi-chat-store`、`multi-chat-keyring`）、存储格式、API 签名全部不变，16 个调用点文件只改导入路径与删除环境分支。`src/utils/tauriCompat/__mocks__/` 与 `src/__test__/helpers/mocks/tauriCompat.ts` 同步迁移。

### D3：状态管理 —— Redux slice 一一对应 Pinia store，持久化显式化

每个 Redux slice 转为一个 Pinia store（`models`、`chat`、`chatPage`、`appConfig`、`modelProvider`、`settingPage`、`modelPage`）；selectors 转为 store 内 `computed` 或独立组合式函数。三个 RTK 监听中间件（聊天列表、模型列表、默认语言持久化）**不**使用 Pinia `$subscribe` 全局订阅，而是在触发持久化的 action 内显式调用既有 storage 服务（`chatStorage`/`modelStorage`）——与监听器"特定 action 触发保存"语义一致、可测性更好、避免订阅时机歧义。

### D4：依赖映射表

| 用途 | 现依赖（React） | 新依赖（Vue 3） |
| --- | --- | --- |
| 框架 | react / react-dom | vue |
| 状态 | @reduxjs/toolkit + react-redux | pinia |
| 路由 | react-router-dom v7 | vue-router v4 |
| i18n | i18next + react-i18next | vue-i18n（语言包复用） |
| 无头 UI | @radix-ui/react-*（shadcn/ui） | reka-ui（shadcn-vue 体系） |
| 图标 | lucide-react | lucide-vue-next |
| Toast | sonner | vue-sonner |
| 表单/表格 | @tanstack/react-form / -table | @tanstack/vue-form / -table |
| 虚拟滚动 | virtua | virtua（原生支持 Vue） |
| 分栏 | react-resizable-panels | splitpanes |
| 瀑布流 | react-masonry-css | 自研 CSS multi-column 组件（规格 `masonry-layout` 约束行为） |
| 主题 | next-themes（仅 sonner 引用） | 自研 `useTheme` 组合式函数（读 `document.documentElement` 类名，约 20 行） |
| 样式 | tailwindcss v4 + cva + clsx + tailwind-merge | 不变（框架无关） |
| 构建 | @vitejs/plugin-react + babel-plugin-react-compiler | @vitejs/plugin-vue（Vue 响应式无需编译期优化） |
| 类型检查 | tsc | vue-tsc（SFC 类型检查） |
| 组件测试 | @testing-library/react | @testing-library/vue + happy-dom（不变） |

### D5：shadcn/ui 基础组件经 shadcn-vue 体系重建

28 个基础组件以 shadcn-vue（Reka UI）官方实现为基线生成，再对照现有 React 版差异（如 `password-input`、`data-table`、`form` 等项目自有封装）做适配。理由：Reka UI 是 radix-vue 的继任者、shadcn 官方 Vue 方案，焦点管理、aria 语义与 Radix 同源，可访问性行为对等成本最低。备选的"逐个手写移植"在 28 个组件规模下成本与风险都更高，不采用。

### D6：路由与 i18n 平移语义

- 路由：`createBrowserRouter` → `vue-router` `createWebHistory`，路由表、嵌套结构、`import.meta.env.BASE_URL` basename、懒加载（React `lazy` → Vue 异步组件 `() => import()`）逐一平移；gh-pages 部署的深链接行为与现状一致（history 模式 + BASE_PATH，现状已如此，不在本次扩大范围）。
- i18n：`services/i18n.ts` 重写为 vue-i18n 初始化模块：语言检测改为 `navigator.language`（原 `locale()` 兼容函数删除）、按需加载与缓存策略、语言持久化逻辑平移；`src/locales/` 的 JSON 资源与 `{{var}}` 插值语法两边兼容，直接复用；`scripts/check-i18n.js` 与翻译类型生成脚本框架无关，仅调整类型模板为 vue-i18n 约定。注意项：i18next 与 vue-i18n 的复数规则语法不同，迁移时需审计含复数键的词条。

### D7：构建与工程链

- `vite.config.ts`：换用 `@vitejs/plugin-vue`，删除 `TAURI_DEV_HOST` 逻辑；manualChunks 的 `packageChunkMap` 更新为 Vue 生态映射（`vendor-vue`：vue/vue-router/pinia/vue-i18n/@vue/*；`vendor-icons`：lucide-vue-next；React/Redux/router 条目删除），其余 markdown/ai/zod/ui-utils 分组不变。
- `package.json` scripts：`dev` → `vite`，`build` → `vue-tsc --noEmit && vite build`，删除 `tauri`/`web:build:tauri` 等条目；`web:dev`/`web:build` 别名收敛。
- oxlint / knip / stryker / vitest 配置扩展 `.vue` 与新依赖感知；husky + lint-staged 流程不变。

### D8：测试迁移策略 —— 场景断言平移，基础设施重建

- 组件/页面测试：语义化查询与行为断言平移到 `@testing-library/vue`（`render`/`fireEvent`→`trigger`、`screen` 查询保留）；mock 基建重建：`render/redux.tsx` → `createTestingPinia` + `mount` 工厂、`mocks/router.tsx` → `createRouter` + `createMemoryHistory`、`mocks/i18n.ts` → vue-i18n 实例注入、`mocks/virtua.tsx` → VirtuaReport Vue 包装。
- 框架无关层（services、store/storage、utils/crypto）的测试基本不动，仅调整导入路径。
- 覆盖率与 mutation 门槛在分支上全程保持既有阈值（`coverage-threshold-policy` 规格约束），不设"迁移豁免期"——测试随组件同阶段迁移，避免欠账。

## Risks / Trade-offs

- [Radix → Reka UI 细微行为差异（焦点圈定、Esc 关闭、aria 属性）] → 以既有可访问性规格场景（`component-accessibility` 等）为验收清单逐组件核对。
- [100 个组件重写引入行为漂移] → 分阶段迁移（导航骨架 → Chat 核心 → Model → Setting），每阶段以对应规格场景测试通过为完成标准；`chat-panel-testing` 等高覆盖规格是回归网。
- [AI 供应商 API 的浏览器 CORS 可达性参差] → 现状 Web 模式已受同样约束（tauriCompat http 的 Web 分支即原生 fetch），行为不变；实施时以 PoC 脚本验证各供应商可达性并将结论写入文档，不可达供应商属产品既有限制，不在本次解决。
- [桌面版用户数据迁移] → 仅剩 JSON 导出/导入路径（`web-store-compat` 数据迁移需求）；发布说明中明确指引。系统 Keychain 中旧主密钥无法被 Web 版读取，用户需走主密钥恢复/重建流程。
- [i18n 复数与格式化语法差异导致运行期译文缺失] → 迁移时用脚本全量扫描语言包差异并在 CI（`lint:i18n`）中拦截。
- [vue-tsc 与现有 tsc 严格度差异] → 阶段 2 起即以 `vue-tsc --noEmit` 作为 CI 类型门禁，避免末期集中爆雷。
- [长分支与 main 演进冲突] → 阶段 1（Tauri 移除）先行合入 main 收窄差异；其余阶段定期 rebase main。

## Migration Plan

1. **阶段 1 —— Tauri 移除（独立可交付）**：删 `src-tauri/`、Tauri 依赖与 scripts；按 D2 溶解 tauriCompat；16 个调用点改导入；React 应用在纯 Web 下全绿。
2. **阶段 2 —— Vue 基础设施**：依赖换装、vite/vue-tsc/测试基建、入口与路由、Pinia stores、i18n 服务、28 个基础 UI 组件。
3. **阶段 3 —— 布局与导航**：Layout、Sidebar、BottomNav、MobileDrawer、初始化流程（InitializationController、initSteps）、FatalErrorScreen。
4. **阶段 4 —— Chat 页**：聊天侧栏、面板网格、消息气泡与流式渲染、发送器、模型选择。
5. **阶段 5 —— Model 页与 Setting 页**：模型表格/表单/创建流程；设置页全部子组件（含密钥管理、恢复对话框）。
6. **阶段 6 —— 工程收尾**：mock/测试基建清账、knip/oxlint/stryker 配置、React 依赖清零验证、chunk 分析复核。
7. **阶段 7 —— 文档与发布**：AGENTS.md、docs/design/cross-platform.md 改写、删 docs/conventions/tauri-commands.md、README 双语同步、CHANGELOG、打 tag `last-react-tauri`、gh-pages 部署验证。

回滚：阶段 1 独立 revert；阶段 2-6 全程在分支，main 不受影响；合并后如需回退，回滚合并提交或回到 tag。

## Open Questions

- 主题能力是否要补齐用户可见的切换入口（现状无入口，`useTheme` 先做等价替换）——不影响架构，可后续独立变更。
- `splitpanes` 与原 `react-resizable-panels` 的持久化分栏比例（若有）是否逐字节兼容——迁移 Chat 面板时以现有规格场景验收，细节可在实现期定。
