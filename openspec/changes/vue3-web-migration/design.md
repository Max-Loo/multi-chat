# 设计：迁移至 Vue 3 并移除 Tauri

## Context

现状与约束（动机见 proposal.md）：

- Tauri 依赖全部收敛在 `src/utils/tauriCompat/` 兼容层（env/shell/os/http/store/keyring，五类插件均有 Web 回退实现），业务代码仅 `resetAllData.ts`、`store/keyring/masterKey.ts` 两处直接判断 `isTauri()`，前端无直接 `invoke()` 调用。
- 前端绑定面：74 个文件引 react、34 个 react-i18next、13 个 react-router-dom、15 个 redux 相关；UI 为 shadcn/ui（Radix）+ Tailwind 4。
- 聊天服务层（`src/services/chat/`，基于 `ai` 核心 `streamText` + Provider）与加密、i18next 资源体系、InitializationManager 均为框架无关代码，可整体保留。
- 路由形态简单：`createBrowserRouter` 嵌套路由 + 懒加载 + 重定向，未使用 loader/action。
- 测试体系庞大：vitest + happy-dom + @testing-library/react + 覆盖率分级阈值 + stryker 变异测试。
- `pnpm web:dev`/`web:build`/gh-pages 部署链路已存在，Web 形态已被验证。

## Goals / Non-Goals

**Goals:**

- 迁移后用户可见功能与迁移前 Web 版完全一致（等功能重写）。
- 仓库中不残留 React 与 Tauri 的任何运行时依赖、构建配置与死代码。
- 框架无关层（services、加密、i18n 资源、时间戳/工具）以最小改动复用。
- 测试与覆盖率体系在迁移完成后恢复到既有水准。

**Non-Goals:**

- 不新增或改进任何用户可见功能。
- 不解决生产环境直连不支持 CORS 的 AI 供应商 API 的问题（既有约束，见 Risks；如需自建代理另行立项）。
- 不重写 i18next 资源体系、聊天服务层、加密体系（仅随平台层路径调整导入）。
- 不在本变更中批量修订其余约 22 个引用 Tauri 场景的既有规格（proposal 已声明，迁移完成后另行立项清理）。

## Decisions

### D1：迁移策略——单分支集中迁移、分阶段推进

React 与 Vue 组件树无法共享一个挂载根，双栈共存（strangler）需要桥接 Redux↔Pinia 状态与双份依赖体积，复杂度远超收益。选择单分支集中迁移，内部按"阶段 1 Tauri 移除 → 阶段 2 Vue 基座 → 阶段 3 逐页面迁移 → 阶段 4 清理"推进，每个模块以"实现 + 测试通过"为完成检查点。
*备选*：strangler 渐进迁移——被否，桥接成本高、双依赖长期共存；一次性新仓库重写——被否，丢失 git 历史与 openspec 规格资产。

### D2：Tauri 移除先行（阶段 1）

Tauri 移除与前端框架无关，先做可将后续 Vue 迁移的改动面缩小到纯 UI 层，且回归定位简单（迁移前后都是同一套 React 代码在 Web 模式下运行）。
做法：`tauriCompat/` 改名 `src/utils/platform/`，删除 Tauri 分支与 `@tauri-apps/*` 依赖，保留公开 API（`createLazyStore`、`keyring`、`fetch`、`getFetchFunc`、`locale`、`isTestEnvironment`、`getPBKDF2Iterations` 及 PBKDF2 常量）；删除 `shell.ts`（`Command`/`shell`），其唯一现实用途（打开外部链接）改用 `window.open`；删除 `src-tauri/`、`tauri.conf.json`、`@tauri-apps/cli`；脚本 `dev`/`build` 直接指向 vite，移除 `web:*` 别名。
*备选*：保留 `tauriCompat` 目录名以减少 diff——被否，纯 Web 项目保留该名称会持续误导；同步做 Vue 迁移——被否，改动面不可控。

### D3：状态管理 Redux Toolkit → Pinia（setup store）

slices → setup stores，selectors → getters/computed，middleware 逻辑下沉到 store 内部或 pinia 插件。`configureStore`/`Provider` 根装配替换为 `createPinia`。Redux 生态的 `immer/reselect` 随之移除。
*备选*：继续用 vanilla Redux——被否，违背 Vue 生态惯例且失去 DevTools 与组合式 API 亲和性；组合式函数 + provide/inject 自建——被否，重造轮子。

### D4：i18n 保留 i18next 核心，自写响应式绑定

资源文件、懒加载、缓存校验、翻译完整性检查、类型生成脚本（`scripts/generate-i18n-types-resources.js`、`check-i18n.js`）全部基于 i18next，保留成本趋近于零。仅将 `react-i18next` 的 `useTranslation` 替换为自研组合式函数：模块级订阅 `i18next.languageChanged` 事件 + `ref` 暴露响应式 `t`。
*备选*：迁移到 vue-i18n——被否，需重写资源加载与检查基础设施，违背"精准修改"原则。

### D5：UI 生态映射

| React 侧 | Vue 侧 | 说明 |
| --- | --- | --- |
| shadcn/ui（Radix） | shadcn-vue（reka-ui） | 同源设计系统，`components/ui/` 重新生成，API 尽量对齐 |
| lucide-react | lucide-vue-next | 同一图标集 |
| sonner | vue-sonner | 官方 Vue 移植，现有 toast 服务层保留 |
| next-themes | 自研主题组合式函数 | 需求简单（明/暗/跟随系统 + localStorage），不值得引依赖 |
| react-router-dom 7 | vue-router 4 | 嵌套路由 + 重定向 + 懒加载一一对应；`BASE_URL` 处理映射到 `createWebHistory(import.meta.env.BASE_URL)` |
| @tanstack/react-form / react-table | @tanstack/vue-form / vue-table | 官方 Vue 适配，headless 范式一致 |
| react-resizable-panels | reka-ui Splitter | shadcn-vue 的 resizable 即基于它 |
| virtua | @virtua/vue | 同库官方 Vue 支持 |
| react-masonry-css | 原生 CSS columns | 该库本质是 CSS 方案，直接用样式实现 |

**待实施时验证**：`@tanstack/vue-form` 的成熟度若不满足 `ModelConfigForm` 需求，降级为自研轻量表单组合式函数（基于 zod，不引重型表单库）。

### D6：聊天服务层与框架无关代码不动

`src/services/chat/`（streamText、ProviderLoader、MetadataCollector、StreamProcessor）、加密工具、InitializationManager、i18n 服务、时间戳工具保持原样；它们不依赖 React。初始化流程中的 React 挂载壳（InitializationController 等组件）以 Vue 重写，对接逻辑不变。

### D7：构建与质量工具链

- Vite：`@vitejs/plugin-react` + React Compiler → `@vitejs/plugin-vue`（Vue 响应式内置，无需编译器）；`manualChunks` 映射重写为 Vue 生态（vendor-vue、vendor-pinia、vendor-router、vendor-i18n 等目标结构不变）；AI 供应商开发代理保留；`chunk-init` 路径过滤随组件路径调整。
- Lint：oxlint 为主（其对 Vue SFC 的支持实施时验证，若覆盖不足则补充 eslint + eslint-plugin-vue）。
- 测试：vitest/happy-dom/覆盖率阈值体系不动；`@testing-library/react` → `@testing-library/vue`；测试 mock 工厂按 Vue 形态适配；React 专属覆盖率排除项（如 `main.tsx`、shadcn 生成物路径）同步改写。
- CI：gh-pages workflow 构建命令 `web:build` → `build`；删除桌面发布 workflow。

### D8：测试迁移与阈值重校准一次完成

组件/页面/hooks 测试随模块在阶段 3 同步重写；迁移期间不在主干上逐次调阈值（避免阈值漂移），阶段 4 一次性重校准覆盖率配置中 React 专属的排除清单，阈值本身维持不变。

## Risks / Trade-offs

- [迁移窗口长，main 难以并行合入] → 迁移分支每日 rebase main；期间 main 仅接受与迁移文件无冲突的修复；必要时设功能冻结窗口。
- [生产环境 CORS：桌面端曾借 plugin-http 绕过同源策略，纯 Web 后直连受限] → 既有 gh-pages Web 版已是此约束，非本变更回归；proposal 已声明为已知限制，如需解法另行立项（自建代理/边缘函数）。
- [keyring/store 数据兼容] → 模块改名只动导入路径，不动 IndexedDB 库名（`multi-chat-keyring`/`multi-chat-store`）与数据格式；阶段 1 验收包含"可读取既有加密数据"。
- [自研 i18n 绑定响应式遗漏（切语言不刷新）] → 绑定层单一实现 + 语言切换集成测试 + 既有 `lint:i18n` 完整性检查保留。
- [189 个组件手工迁移引入行为回归] → 以现有测试为行为基线，逐模块"实现 + 测试重写通过"推进；无对应测试的组件先补冒烟级渲染测试再迁移。
- [覆盖率在迁移中途跌破阈值阻塞 CI] → 迁移分支内的 CI 以阶段 4 重校准为最终门槛，中途失败不阻塞阶段推进（分支内约定，不合入主干）。
- [oxlint/stryker 对 .vue 的工具链成熟度] → 阶段 2 基座期先验证，oxlint 不足则补 eslint-plugin-vue；stryker 在阶段 4 单独跑一次全量确认。

## Migration Plan

1. **阶段 0 基线**：main 全量测试通过并记录覆盖率基线。
2. **阶段 1 Tauri 移除**（可独立合并）：平台层收缩改名、删除 src-tauri、脚本重命名、CI/workflow 调整、文档同步；验收 = 全量测试通过 + Web 构建/运行正常。
3. **阶段 2 Vue 基座**：plugin-vue、vue、pinia、vue-router、vue-i18n 绑定（自研）、主题、vue-sonner、shadcn-vue 基础组件、新入口与布局壳；与 React 入口并行存在于分支内，不合并。
4. **阶段 3 模块迁移**：按"布局/通用组件 → Chat 页 → Model 页 → Setting 页 → 404/初始化壳"顺序逐模块迁移并重写测试。
5. **阶段 4 清理收尾**：删除 React 树与依赖、vite 分包重映射、覆盖率重校准、全量测试 + 变异测试、AGENTS.md/README 双语/docs 同步、gh-pages workflow 验证。
6. **回滚**：合并前放弃分支即可；合并后回滚 = revert 合并提交（无破坏性数据 schema 变更，用户数据不受影响）。

## Open Questions

（无阻塞性问题。D5 中 `@tanstack/vue-form` 成熟度与 oxlint 的 Vue SFC 支持已在设计内给出降级路径，不影响规格与任务拆分。）
