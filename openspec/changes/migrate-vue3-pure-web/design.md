# Design

## Context

当前应用为 React 19 + Tauri 2.0 双模式应用（约 185 个源文件 / 2 万行），所有 Tauri 能力已被 `src/utils/tauriCompat/` 兼容层封装：业务代码零直接 `invoke()` 调用、零自定义 Rust 命令、每个 Tauri API 均有已在生产（GitHub Pages 在线版本）验证的 Web 降级实现。技术栈事实：Redux Toolkit（7 slice + 3 持久化中间件）、react-router-dom v7、shadcn/ui（Radix）28 个原子组件、Tailwind CSS v4、i18next 自研懒加载服务层、AI SDK v6（框架无关）、Web Crypto 加密层（框架无关）、vitest + RTL 约 178 个单测 + 11 个集成测试。动机见 proposal.md - Why。

## Goals / Non-Goals

**Goals:**

- 阶段化执行，每阶段独立可验证、可合并、可回滚
- Web 版用户（IndexedDB）数据格式零变化，升级无感
- 迁移后测试体系（vitest/stryker/knip/fake-indexeddb）继续可用，测试意图全量保留
- 用户可感知行为不变（以现有 spec 与测试意图为验收基线）

**Non-Goals:**

- 不做桌面版数据自动迁移（浏览器无法读取桌面版本地文件，走主密钥导出/导入）
- 不引入 SSR/微前端/双框架并存桥接
- 不趁机重构业务逻辑或改 UI 设计（行为冻结，仅换实现）

## Decisions

### D1: 一次性整体迁移，但拆为两个独立阶段

React 与 Vue 无法在同一 SPA 中低成本并存（需微前端桥接 Redux/Pinia 状态，桥接层本身成为新维护负担）。项目为个人项目、迁移期功能冻结，一次性重写成本最低。

但拆为两个独立合并的阶段，控制故障面：

1. **阶段 1（纯 Web 化，React 不动）**：删除兼容层 Tauri 分支、`src-tauri/`、全部 Tauri 依赖，目录重命名
2. **阶段 2（Vue 迁移）**：在纯 Web 基础上替换框架

被否决的替代方案：三阶段（先框架后 Web 化）——顺序颠倒会让 Vue 迁移基于"仍有 Tauri 分支"的代码，随后又要二次触碰全部 composables；一步到位——出错时无法定位是 Web 化问题还是框架问题。

### D2: `tauriCompat` 重命名为 `platform`，模块 API 形状不变

`src/utils/tauriCompat/` → `src/utils/platform/`。每个模块删除 Tauri 分支后，Web 实现成为唯一路径，导出签名零变化：业务侧 10 个消费文件仅改导入路径。`env.ts` 删除 `isTauri()`，保留 `isTestEnvironment()` / `getPBKDF2Iterations()`；`shell.ts` 删除 `Command` Null Object（无业务使用方），保留 `open()`（`window.open` 降级即为唯一实现）。

被否决的替代方案：保留 `tauriCompat` 目录名——纯 Web 项目中名称误导，违背"移除 Tauri 相关代码"的目标。

### D3: Redux Toolkit → Pinia，持久化从中间件移入 store action

7 个 slice 一一映射为 7 个 Pinia store（state ≈ slice state，getters ≈ selectors，actions ≈ reducers + 异步逻辑）。3 个持久化中间件（chat/model/appConfig）改为在对应 store 的变更 action 内显式调用 storage 写入——与中间件语义等价（变更即持久化、无防抖），且可测试性更好（无需模拟中间件链）。

被否决的替代方案：`@reduxjs/toolkit` 搭配 Vue（无官方绑定，react-redux 不可用）——失去工具链意义；Pinia `$subscribe` 全局订阅——写入触发点隐式，测试需模拟整个 store 实例。

### D4: shadcn-vue（reka-ui）替换 shadcn/ui（Radix UI）

两者同源设计（shadcn-vue 是 shadcn/ui 的 Vue 移植），Tailwind 类名与视觉体系可大部分复用，仅组件 API 有少量差异（如 `isOpen` → `modelValue`、`asChild` 语义差异）。28 个 UI 原子组件按"复制 shadcn-vue 源码进 `src/components/ui/`"的方式迁移（与当前 shadcn/ui 的使用方式一致，组件代码归项目所有）。

被否决的替代方案：Element Plus / Naive UI——视觉体系全变，Tailwind 主题与现有设计需重做。

### D5: i18n 保留 i18next 核心，自写 `useI18n` composable

`src/services/i18n.ts`（按需加载、缓存、Toast 队列、自动持久化）完全框架无关，100% 复用；仅用 <30 行的 `useI18n` composable（`i18next.t` + 语言变更事件触发响应式更新）替换 `react-i18next` 的 `useTranslation`。

被否决的替代方案：vue-i18n——需重写全部翻译资源组织方式与懒加载逻辑，scripts/check-i18n.js、类型生成脚本全部重做，风险大收益零。

### D6: 依赖映射清单

| 现依赖（React 侧） | 迁移后 | 说明 |
| --- | --- | --- |
| react / react-dom / react-redux / @reduxjs/toolkit | vue / pinia | 框架与状态管理 |
| react-router-dom v7 | vue-router 4 | 路由结构、懒加载、basename 等价迁移 |
| @radix-ui/react-*（13 个） | shadcn-vue + reka-ui | 按需引入 |
| lucide-react | lucide-vue-next | 同名图标 |
| sonner | vue-sonner | 官方 Vue 版，API 兼容 |
| next-themes | 自写 `useTheme` composable | localStorage + class 切换 + `prefers-color-scheme` 监听（<50 行） |
| @tanstack/react-form / react-table | @tanstack/vue-form / vue-table | TanStack 官方 Vue 版 |
| react-masonry-css | CSS `columns` 原生实现 | 去 JS 依赖 |
| react-resizable-panels | splitpanes | Vue 生态标准面板库 |
| @vitejs/plugin-react + babel-plugin-react-compiler | @vitejs/plugin-vue | React Compiler 无对应需求：Vue 响应式系统自带细粒度更新 |
| @testing-library/react | @vue/test-utils + @testing-library/vue | 见 D8 |
| virtua / ai / @ai-sdk/* / zhipu-ai-provider | 不变 | 官方支持 Vue / 框架无关 |
| @tauri-apps/*（6 个）+ tauri-plugin-keyring-api | 删除 | 阶段 1 |

### D7: 构建与代码质量工具链

- `tsc` 检查改为 `vue-tsc`（`pnpm tsc` 脚本指向不变）
- vite.config：移除 `TAURI_DEV_HOST`、`src-tauri` watch ignore、`vendor-tauri` chunk；manualChunks 重组出 `vendor-vue`（vue/pinia/vue-router）；保留 proxy、BASE_PATH、highlight.js 拆包、覆盖率排除（路径更新）
- oxlint 保留（覆盖 `.vue` 的 `<script>`）；模板规范由 vue-tsc + review 承担
- knip / stryker / husky / fake-indexeddb / happy-dom 保留，配置中路径按重命名更新

### D8: 测试迁移策略——逻辑平移 + 组件重写

- **平移**：store（改 Pinia 断言风格）、services、utils、storage、crypto 等纯逻辑测试，改导入路径后保留测试意图；`tauriCompat` 相关测试删除 Tauri 分支用例、保留 Web 实现用例
- **重写**：RTL 组件测试按原测试意图（describe/it 的行为断言）用 @vue/test-utils + @testing-library/vue 重建；`userEvent` 保留（DOM 事件层面与框架无关）
- **门禁**：chatStorage / modelStorage / crypto 的测试先行平移并保持绿色，作为数据格式兼容的回归门禁
- 集成测试（11 个）按行为场景重建于 Vue 环境

### D9: keyring 安全警告文案更新

原文案"Web 版本的安全存储级别低于桌面版，建议在桌面版中处理敏感数据"在纯 Web 后失去意义。新文案说明：密钥加密存储于浏览器本地；清除浏览器数据将导致已加密数据无法解密；建议使用主密钥导出功能备份。触发时机与"不再提示"标记（localStorage `multi-chat-security-warning-dismissed`）不变。

### D10: 前置修复 4 个旧格式主 spec

`tauri-plugin-web-compat`、`http-fetch-compat`、`os-locale-compat`、`tauri-compat-env-testing` 四个主 spec 文件为历史遗留格式（正文中含 `## ADDED Requirements` delta 头，无 `## Requirements` 主段），结构无效会导致 archive 拒绝。实施第一步将它们修复为标准主 spec 格式（标题行调整，内容不变）。

## Risks / Trade-offs

- **[2 万行重写引入行为回归]** → 以现有 262 个 spec 与 178 个测试文件的测试意图为逐模块验收清单；核心流程（发送消息、流式渲染、模型增删、密钥导入导出）保留集成测试；每模块迁移后手动冒烟
- **[shadcn-vue 与 Radix 行为细节差异（焦点管理、键盘导航、portal）]** → 逐组件对照现有无障碍 spec（如 component-accessibility）验收；差异点在 PR 中显式列出
- **[Vue 深度响应式与 AI SDK 流式 chunk 高频更新的性能冲突]** → 流式内容用 `shallowRef` + 显式触发更新，长列表由 virtua 虚拟滚动承接（与现状一致）；聊天大数组避免不必要的深拷贝
- **[迁移分支与 main 长期漂移]** → 迁移期功能冻结；仅 bug 修复 cherry-pick 到迁移分支；两阶段各自独立 PR 缩短单分支存活期
- **[IndexedDB 数据格式意外破坏]** → 存储层测试先行平移并全程保持绿色；阶段验收包含"旧数据升级"手工验证（用迁移前版本产生数据）
- **[oxlint 对 `.vue` 模板检查能力有限]** → vue-tsc 承担类型与模板检查；接受 lint 范围收缩为 script 部分
- **[React Compiler 移除后性能回退担忧]** → Vue 无 VDOM 全量 diff 的组件级响应式更新等价承接编译器收益；用现有 chat-button-perf-verification 等 spec 验收

## Migration Plan

1. **阶段 0（准备）**：修复 4 个旧格式主 spec（D10）；创建 `feat/migrate-vue3-pure-web` 长期分支
2. **阶段 1（纯 Web 化，React 保持可用）**：目录重命名与 Tauri 分支删除、`src-tauri/` 删除、依赖清理、脚本收敛（`dev`/`build` = Vite）、安全警告文案、文档更新；验收 = `web:dev`/`web:build` + 测试全绿 → 独立 PR 合并
3. **阶段 2（Vue 迁移）**：工具链切换（D7）→ UI 原子组件（D4）→ 入口/路由/Pinia（D3）→ composables → 页面与业务组件分模块迁移（Chat → Model → Setting → 其他）→ 测试重写（D8）；验收 = 全量测试 + 冒烟 + Lighthouse/包体积对比 → 独立 PR 合并
4. **阶段 3（收尾）**：AGENTS.md / docs / README 双语、knip/stryker 配置校准、`openspec archive`
5. **回滚策略**：阶段 1、2 均为独立 PR；阶段 2 不可解时回滚到阶段 1 产物——纯 Web React 版完整可用，变更目标已完成一半且不损失任何功能
