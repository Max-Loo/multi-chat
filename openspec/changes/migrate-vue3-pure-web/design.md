# Design

## Context

迁移前代码库的实测状况（决定方案的边界条件）：

- **Tauri 消费面高度集中**：`@tauri-apps/*` 仅被 `src/utils/tauriCompat/` 直接导入；业务代码（`store/storage`、`store/keyring`、`services/chat`、`services/modelRemote`、`hooks`、`config`）全部经由兼容层访问平台能力；Rust 侧零自定义命令（`src-tauri/src/lib.rs` 仅注册插件）。Web 回退实现（IndexedDB 存储、Web keyring、native fetch、navigator.locale）已存在并有对应 specs。
- **前端规模**：189 个 `.tsx`、225 个 `.ts`、42 个 hooks；Redux Toolkit 7 个 slice + 3 个 middleware + selectors；react-router-dom 7 条路由（全部懒加载）。
- **测试体系**：vitest + happy-dom + @testing-library/react + msw + stryker 变异测试 + fake-indexeddb；约 200 个 specs 中大量为测试类能力规格。
- **部署**：GH Pages 静态部署链路（`web:build` + `deploy:gh-pages`）已就绪，Web 端用户数据在 IndexedDB/localStorage。

动机与范围见 proposal.md，行为契约见各 delta specs。

## Goals / Non-Goals

**Goals**：

- 单一构建形态（纯 Vite 静态站点）与单一 UI 框架（Vue 3 组合式 API）
- 迁移过程可分批验证、可随时中止、可回滚
- 用户可感知行为零变化；Web 端既有用户数据（IndexedDB/localStorage）无缝延续

**Non-Goals**：

- 不支持 React/Vue 长期共存（两套渲染根与路由不可共存，互操作方案成本高于整层重写）
- 不引入服务端渲染/SSG（保持纯 SPA 静态部署）
- 不迁移桌面端历史数据；不在本次变更中新增功能

## Decisions

### D1. 阶段顺序：先移除 Tauri，后迁移 Vue

Tauri 移除在 React 代码上独立完成并先行合入 `main`（改动面小、可独立验证：构建脚本、依赖清单、兼容层内部实现）。Vue 迁移随后在纯 Web 代码上进行，避免在迁移期间同时维护「双端 × 双框架」的矩阵。

- 备选：先 Vue 后 Tauri —— 弃，React→Vue 大重写期间还要处理双端分支，风险叠加。
- 备选：两者并行一次完成 —— 弃，回归时无法归因。

### D2. 迁移策略：分支上整层重写，按能力域分批提交

在长驻分支 `feat/vue3` 上完成基础设施切换与 UI 重写，按能力域（基础组件 → 布局/导航 → Chat → Model → Setting）提交，期间 `main` 继续走阶段一的 Tauri 移除；`feat/vue3` 定期 rebase。最终整分支合入。迁移期间功能冻结。

- 备选：渐进式共存（微前端/双入口）—— 弃，项目规模下复杂度不划算。

### D3. 状态层：Redux Toolkit → Pinia（setup store 风格）

Pinia 是 Vue 官方推荐，`defineStore` setup 语法与现有 slice + thunk 的心智最接近；devtools 与 TS 推导完善。

- **slices → stores**：7 个 slice 按域映射为 7 个 Pinia store（chat、chatPage、model、modelPage、modelProvider、setting、appConfig），保持既有状态字段与 action 命名以降低回归面。
- **middleware → store 订阅 + Pinia 插件**：3 个 middleware 的持久化联动改用 `$subscribe`（含防抖语义保持）实现，注册收敛到单一插件文件。
- **selectors → 组合函数**：`src/store/selectors` 与 `useCurrentSelectedChat` 等读取逻辑改为返回 `computed` 的 composables，缓存语义由 `computed` 天然承接。
- 备选：保留 Redux（有 Vue 绑定但非主流，团队心智割裂）—— 弃。

### D4. 组件库：shadcn-vue（reka-ui）

与现有 shadcn/ui + Radix 同源（reka-ui 是 Radix 的 Vue 移植），视觉令牌与 API 设计对等度最高，`cva` + `tailwind-merge` + `clsx` 工具链可原样保留。逐组件映射：

| 现有 | 目标 | 备注 |
| --- | --- | --- |
| @radix-ui/react-*（14 个包） | shadcn-vue / reka-ui 对应组件 | Dialog、AlertDialog、DropdownMenu、Select、Popover、Tooltip、Switch、Checkbox、RadioGroup、Progress、Label、Avatar、Slot |
| lucide-react | lucide-vue-next | API 同名 |
| sonner | vue-sonner | 与既有 Toast 队列服务对接 |
| next-themes | 自写 `useTheme` composable（约 30 行，基于 `matchMedia` + localStorage） | 避免引入维护不活跃的第三方 |
| @tanstack/react-form | @tanstack/vue-form | headless，校验逻辑可复用 |
| @tanstack/react-table | @tanstack/vue-table | headless，列定义可复用 |
| react-resizable-panels | reka-ui Splitter | shadcn-vue Resizable |
| virtua | @virtua/vue | 同一作者的 Vue 版本，虚拟滚动行为一致 |
| react-masonry-css | CSS `columns` 方案 | 仅 1 处使用（Provider 网格），无需引库 |
| React.lazy + Suspense | `defineAsyncComponent` + vue-router 懒加载 | — |
| React Compiler | 移除 | Vue 细粒度响应式无需编译器优化 |

- 备选：Element Plus / Naive UI —— 弃，视觉风格漂移大，a11y 规格需重新验证。

### D5. i18n：保留 i18next 核心，自写响应式绑定层

既有 i18n 服务层（`src/services/i18n.ts`：按需加载、缓存验证、Toast 队列、自动持久化、完整性检查）是框架无关投资且有大量 specs 固化，原样保留；仅将 `react-i18next` 绑定替换为薄组合函数：模块级 `ref(currentLanguage)` + i18next `languageChanged` 事件同步，`useTranslation()` 返回响应式 `t`。

- 备选：vue-i18n —— 弃，需要重写服务层并废弃既有语言包加载/校验逻辑与相关 specs。
- `scripts/check-i18n.js` 与 i18n 类型生成脚本不动。

### D6. 平台层处置：重命名 + 删除 Tauri 分支

阶段一将 `src/utils/tauriCompat/` 重命名为 `src/utils/platform/`（导入点约 15 处 + 测试 mock 路径，机械替换），内部删除 `shell.ts`、Tauri 原生分支与 `@tauri-apps/*` 导入，Web 实现成为唯一实现；`isTauri()` 保留恒返回 `false`（业务与测试中约 20 处调用点暂不改动），在清理阶段评估删除。Keyring V1→V2 迁移逻辑保留（Web 端用户仍有 V1 历史数据）。`env.ts` 的 PBKDF2 迭代数与测试环境检测逻辑不动。

### D7. 测试策略：旧测试即规格，随能力域同步重写

- 纯逻辑测试（services/utils/store 逻辑、tauriCompat 平台层）：文件不动或仅改导入路径。
- 组件测试：以既有 @testing-library/react 测试为行为规格，用 @testing-library/vue 重写；msw/fake-indexeddb/happy-dom 保留；stryker 配置随测试目录结构微调，迁移完成后跑全量变异测试验收。
- 测试不迁移到位的能力域不标记完成（失败要大声：每个能力域的 tasks 必须含测试项）。

### D8. 构建：Vite 单轨

- Vite 插件：`@vitejs/plugin-react` → `@vitejs/plugin-vue`（+ 开发期 `vite-plugin-vue-devtools`）。
- 脚本收敛：`dev` → `vite`，`build` → `tsc && vite build`，删除 `tauri`、`web:*` 系列脚本；`deploy:gh-pages` 保持。
- TS 配置：`jsx: react-jsx` 相关设置移除，新增 Vue SFC 类型支持（`vue-tsc` 接管类型检查，`build` 使用 `vue-tsc && vite build`）。

## Risks / Trade-offs

- [189 个组件的规模导致迁移周期长、中途状态不可用] → 分支上按能力域推进，每个能力域在分支内保持可运行（vitest + 手动冒烟清单）；不合入即不影响 main。
- [行为回归] → 旧组件测试作为行为快照逐域重写；迁移完成后全量测试 + 变异测试验收；关键路径（聊天发送、模型加密存储、i18n、主题）列入手动冒烟清单。
- [reka-ui 与 Radix 个别交互细节不一致（如 Select 键盘循环、Tooltip 时序）] → 映射表逐组件核对；差异在实现时以现有 specs 场景为准对齐。
- [首屏 bundle 体积回归] → 阶段一结束与分支合入前各做一次构建体积基线对比（rollup-plugin-visualizer 已有）。
- [Safari IndexedDB/Web Crypto 边缘行为] → 既有浏览器兼容性 specs 场景保持为验收项。
- [长驻分支 rebase 冲突累积] → 阶段一先行合入后再全速推进 Vue 迁移；迁移期间 main 功能冻结，冲突面小。

## Migration Plan

1. **阶段 0（基线）**：全量测试通过；记录构建产物体积基线。
2. **阶段 1（Tauri 移除，独立 PR 合入 main）**：删除 `src-tauri/` 与全部 `@tauri-apps/*` 依赖；tauriCompat → platform 重命名与内部清理；脚本收敛；文档同步。
3. **阶段 2（Vue 基础设施，`feat/vue3` 分支）**：新增 Vue/Pinia/vue-router/reka-ui 依赖；Vite/TS 配置切换；入口挂载、路由、主题、i18n 绑定、Pinia stores 骨架。
4. **阶段 3（UI 重写，按域推进）**：基础组件库 → Layout/导航 → Chat 页域 → Model 页域 → Setting 页域；每域包含组件重写 + 测试重写 + 冒烟验证。
5. **阶段 4（收尾，合入前）**：React 残留依赖清除（knip 校验）；`AGENTS.md`、`README.md`/`README.zh-CN.md`、`docs/design/*` 同步更新；主 specs 中被本变更修改能力的 Purpose 更新；全量测试与体积对比。
6. **回滚策略**：阶段 1 通过 revert 独立回滚；阶段 2–4 位于分支，不合入即零影响；合入后如发现严重问题，按能力域 revert 对应 commit。

## Open Questions

- reka-ui 个别组件与 Radix 的键盘交互微差，需在实现各组件时对照现有 specs 场景逐一对齐（不影响任务拆分）。
- `tauriCompat` 重命名后的最终目录名（`platform/` 为建议值）在阶段一实施时确定，specs 中已用「重命名后的等价路径」表述兼容。
