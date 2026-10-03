# Design

## Context

见 proposal.md 的动机。影响设计的关键现状事实：

- **框架无关层与 UI 层边界清晰**：`types/`、`services/`（chat、initialization、modelRemote、toast、i18n）、`store/storage/`、`store/keyring/`、`utils/`（除 tauriCompat 的双轨分支）、`locales/` 均为纯 TypeScript，不依赖 React；合计约 1/3 的非测试代码可平移复用。
- **Tauri 依赖面已收敛**：Rust 端零自定义命令（21 行），前端仅 4 个非测试文件直接 import `@tauri-apps/*` 且全部位于 `src/utils/tauriCompat/` 内；Web 降级实现（IndexedDB store、IndexedDB + AES-GCM keyring、原生 fetch、window.open、navigator.language）均已存在且被 spec 覆盖。
- **UI 层为重写主体**：pages（49 文件/4947 行）、components（50 文件/4870 行，其中 28 个 shadcn/ui 原子组件）、hooks（16 文件）、Redux slices + middleware（10 文件）。
- **测试规模**：187 个测试文件（约 51509 行），其中相当比例为框架无关逻辑测试（services/store/storage/utils 目录下）。
- **React 专属依赖无 Vue 官方版**：react-masonry-css、react-resizable-panels 需替代方案；其余（Tanstack form/table、lucide、sonner、virtua）均有官方或成熟 Vue 对应物。

## Goals / Non-Goals

**Goals:**

- 一次性切换到 Vue3 组合式 API + 纯 Web 运行时，迁移后业务行为、URL、数据格式、加密算法、IndexedDB/localStorage 键名与迁移前完全一致
- 最大化平移框架无关代码与测试，把重写范围严格限制在 UI 层与状态绑定层
- 保持既有工程质量设施有效：Vitest 分模块覆盖率阈值、集成测试、Stryker 变异测试、oxlint/lint-staged、GitHub Pages 自动部署

**Non-Goals（设计层面）:**

- 不引入 SSR/SSG、不引入组件测试以外的 E2E 框架
- 不重构业务逻辑、不"顺手优化"被平移的框架无关代码（遵循精准修改原则）
- 不为桌面版用户提供数据迁移工具（proposal 已声明为 BREAKING 取舍）

## Decisions

### D1. 一次性切换，不做双框架共存

**选择**：在独立分支上一次性完成迁移，main 保留 React 版本直至切换验收通过。

**理由**：无自定义后端 IPC，双框架共存需要同时维护两套路由、两套 UI 库、Redux↔Pinia 状态桥接，其复杂度与维护成本高于一次性重写；且现有 spec 基础（约 250 个能力规格，绝大多数描述框架无关的业务行为）可直接作为回归验收依据。

**备选**：逐页渐进迁移（micro-frontend 式挂载）——否决，桥接层本身就是一个要长期背负的新增复杂度。

### D2. 状态管理：Pinia setup store 一一映射 Redux slice

**选择**：7 个 Redux slice → 7 个 Pinia store（组合式 API setup 风格）；3 个 Redux 监听中间件（聊天持久化、模型持久化、语言持久化）→ 各 store 内部的 `watch`/`$subscribe` 触发同样的持久化调用；记忆化 selectors → `computed`。

**理由**：setup store 与组合式 API 心智一致；slice 结构一对一映射可将 975 行的 chatSlice 等按既有 reducer 逻辑机械转写（state → `ref`，reducer → action 函数），降低引入行为偏差的风险；持久化副作用继续调用既有 `store/storage/` 函数，数据流不变。

**备选**：Pinia options 风格——否决，与组合式 API 统一性差；继续手写轻量响应式 store——否决，偏离 Vue 官方生态。

### D3. 目录与文件组织按 Vue 惯例调整

**选择**：`pages/` 保留命名但内容改为 `.vue`；`hooks/` → `composables/`；`components/ui/` 由 shadcn-vue CLI 重新生成；其余目录（services/store/types/utils/config/router/locales）结构与命名不变。`main.tsx` → `main.ts`。

**理由**：composables 是 Vue 社区强惯例；其余目录本就框架中立，保留可让 AGENTS.md 快速查找表与既有文档的改动最小。

### D4. tauriCompat 收敛为 `src/utils/webStorage/`，平台 API 各归其位

**选择**：

| 现文件 | 去向 |
| --- | --- |
| `store.ts`、`keyring.ts`、`keyringMigration.ts`、`indexedDB.ts`、`crypto-helpers.ts`、`env.ts`（仅保留测试环境检测与 PBKDF2 常量） | `src/utils/webStorage/`（保留 Web 实现，删除双轨分支与 `isTauri()`） |
| `http.ts` | 简化为 `src/utils/fetchProvider.ts`：直接导出原生 `fetch` 与 `getFetchFunc()`（AI SDK provider 注入仍需可替换的函数引用） |
| `shell.ts` | 拆为 `src/utils/openExternal.ts`（`window.open(url, '_blank', 'noopener,noreferrer')`） |
| `os.ts` | 删除，`locale()` 逻辑并入 `services/global.ts`（本就是 `navigator.language` 封装） |

**理由**：模块名与新现实一致（纯 Web 存储而非"Tauri 兼容层"）；`KeyringPublicAPI`、`StoreCompat` 等类型自维护（原类型来自将删除的 Tauri 插件包），签名保持不变以满足 `web-keyring-compat`/`web-store-compat` delta 的 API 一致性要求。消费方（masterKey、resetAllData、initSteps、providerFactory、modelRemote、global、useNavigateToExternalSite、storage/*）仅改 import 路径与去掉 `isTauri()` 分支。

### D5. UI 组件体系：shadcn-vue（reka-ui）

**选择**：用 shadcn-vue CLI 按 `components.json` 等价配置重新生成 28 个原子组件；CVA、clsx、tailwind-merge、Tailwind 4 配置原样保留；图标换 `lucide-vue-next`；toast 换 `vue-sonner`（保留现有 toastQueue 队列封装与 ToasterWrapper 行为）；主题切换用 `@vueuse/core` 的 `useDark`/`useToggle` 替代 next-themes（localStorage 键与 class 策略对齐现有行为）。

**理由**：shadcn-vue 与现有 shadcn/ui 同源同视觉语言，Tailwind 类名与设计令牌可直接复用，是视觉/交互等价迁移成本最低的路径。

### D6. i18n：保留 i18next 核心，绑定层换 i18next-vue

**选择**：`services/i18n.ts`（389 行：懒加载、缓存、指数退避重试、`tSafely`、Toast 反馈）核心逻辑不动，仅把 `react-i18next` 的 `initReactI18next` 与组件内 `useTranslation` 替换为 `i18next-vue` 的初始化与等价组合式 API；语言资源 JSON 与类型生成脚本不变。

**理由**：自研封装与语言资源全部投资在 i18next 核心上；换 vue-i18n 意味着重写资源格式、加载器、类型生成与校验脚本，收益为零。

**备选**：vue-i18n——否决，如上。

### D7. React 专属库的替代方案

| 现依赖 | 替代 | 说明 |
| --- | --- | --- |
| `@tanstack/react-form` | `@tanstack/vue-form` | 同家族官方 Vue 版 |
| `@tanstack/react-table` | `@tanstack/vue-table` | 同上 |
| `react-masonry-css` | CSS `columns` 布局 | 现库即 CSS columns 的薄封装，直接内联同等样式 |
| `react-resizable-panels` | 自研轻量分割组件（pointer events + flex） | 无维护良好的官方 Vue 版；现有使用场景（面板分割）交互面窄，自研成本低于引入不可靠移植 |
| `virtua` | `virtua`（Vue 支持） | 官方多框架支持 |
| `next-themes` | `@vueuse/core` `useDark` | 见 D5 |
| `babel-plugin-react-compiler` | 移除，无替代 | Vue 响应式系统自带细粒度更新，无需编译期优化 |

### D8. 构建与工具链

- Vite：`@vitejs/plugin-react` → `@vitejs/plugin-vue`；dev 端口 1420 与 `/deepseek`、`/kimi`、`/zhipuai`、`/zhipuai-coding-plan` 代理保留；`manualChunks` 重划（`vendor-react/redux` → `vendor-vue/pinia/router`，删除 `vendor-tauri`，radix chunk 并入 reka-ui）
- 类型检查：`vue-tsc` 替代 `tsc`（`pnpm tsc` 脚本语义不变）
- Lint：oxlint 继续负责 `.ts/.js`；新增 eslint（flat config）+ `eslint-plugin-vue` 仅负责 `.vue`；lint-staged 规则相应扩展
- 测试：Vitest 4 配置保留（pool/覆盖率阈值/集成测试独立配置），`@testing-library/react` → `@testing-library/vue`，happy-dom 与 fake-indexeddb 不变；Stryker `mutate` 列表按新目录重映射
- 版本脚本：`scripts/update-version.js` 移除 `tauri.conf.json`/`Cargo.toml` 同步，仅更新 `package.json`

### D9. 测试迁移分三档推进

1. **平移**：services/、store/storage/、store/keyring/、utils/（纯逻辑，mock 不涉 React）——改 import 路径为主，预期可复用大部分用例与断言
2. **转写**：hooks → composables 测试（挂载方式从 renderHook 换为组合式调用或轻量挂载组件）
3. **重写**：pages/components 测试用 @testing-library/vue 重写，断言仍以用户行为为准（沿用现有 Testing Library 风格与 fixtures/helpers）

覆盖率阈值（hooks 90%/services 80%/store 80%/utils 80%/components 70%）按新目录名重映射后维持原值。

### D10. Tauri 移除清单（与框架迁移解耦，可先行）

`src-tauri/` 整目录、5 个 `@tauri-apps/*` + `tauri-plugin-keyring-api` + `@tauri-apps/cli` 依赖、`package.json` 的 `tauri`/`dev`/`build` 脚本合并为现有 web 工作流（`dev` → `vite`，`build` → `tsc && vite build` 语义，`web:build:tauri` 删除）、`.github/workflows/build-and-release.yml`、vite.config 的 `TAURI_DEV_HOST` 与 `src-tauri` ignore、capabilities 目录随 `src-tauri/` 一并删除。

## Risks / Trade-offs

- [大规模 UI 重写引入行为回归] → 以既有能力规格为验收清单逐页面核对；集成测试（9 个，覆盖聊天主流程）优先迁移，作为迁移完成的硬门槛
- [reka-ui 与 Radix 在焦点管理/键盘细节上的行为差异] → 逐组件按交互场景（Esc、Tab 循环、aria 属性）比对验收，差异在 UI 允许范围内吸收，超出的记录为已知差异
- [自研分割面板/masonry 的质量风险] → 功能面窄（面板拖拽、瀑布流布局），配足单元测试；如实施中发现成熟 Vue 替代可替换（见 Open Questions）
- [桌面用户本地数据不可达] → 有意 BREAKING；README 与发布说明明确告知，引导需要数据的用户在迁移前使用桌面版导出
- [测试重写工期长] → 三档策略（D9）把重写范围压到 UI 层；平移档先恢复绿色基线再推进重写档
- [oxlint 与 eslint 双工具并存的配置漂移] → lint 脚本聚合两者，CI 中同一命令校验；分工边界写入 AGENTS.md
- [迁移期间主线并行开发冲突] → 独立分支 + 尽快合并窗口；合并前 main 上的功能改动需人工评估回移

## Migration Plan

实施顺序（详见 tasks.md）：

1. Tauri 移除与 webStorage 收敛（D10 + D4）——框架无关，先行落地并保持 React 版可用
2. 工具链切换（Vue/Pinia/vue-router/vite 插件/vue-tsc/eslint）——此时应用尚不可运行，进入切换阶段
3. 框架无关层与平移档测试就位（绿基线）
4. Pinia stores + 持久化副作用
5. shadcn-vue 组件库重建
6. 路由 + 页面/组件/composables 重写（Chat → Model → Setting 顺序，聊天页为验收核心）
7. 集成测试恢复 + 覆盖率阈值恢复 + Stryker 配置更新
8. 文档（AGENTS.md、README 双语、docs/）与版本脚本收尾

**回滚策略**：全部工作在独立分支进行；合并前 main 始终是可发布的 React+Tauri 版本，随时可放弃分支回滚。合并后回滚以 git revert 为准（数据格式未变，无不可逆状态）。

## Open Questions

- 分割面板组件最终选自研还是引入社区 Vue 移植——实现到该组件时按质量决定，不影响整体架构与任务分解
- masonry 场景是否直接用单列/网格降级（若现有使用场景视觉上可接受）——实现时以视觉验收定夺
- eslint flat config 的具体规则集强度——实施时与 oxlint 现有规则对齐即可
